package com.CricLively.Service;

import com.CricLively.DTO.AddTournamentRequest;
import com.CricLively.DTO.ExtendTournamentRequest;
import com.CricLively.DTO.TournamentDashboardResponse;
import com.CricLively.Entities.Enums.TournamentStatus;
import com.CricLively.Entities.Tournament;
import com.CricLively.Entities.TournamentExtension;
import com.CricLively.Repository.TournamentRepository;
import com.CricLively.Websocket.LiveScoreHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TournamentService {

    private final TournamentRepository tournamentRepository;
    private final MatchAccessService accessService;
    private final LiveScoreHandler liveScores;

    public List<TournamentDashboardResponse> getTournamentDashboard(Authentication auth) {
        MatchAccessService.Actor actor = accessService.actor(auth);
        return tournamentRepository.findAll()
                .stream()
                .map(t -> mapToDashboardResponse(t, actor))
                .collect(Collectors.toList());
    }

    private TournamentDashboardResponse mapToDashboardResponse(Tournament tournament, MatchAccessService.Actor actor) {
        LocalDate today = LocalDate.now();
        boolean finished = tournament.finishedOn(today);

        TournamentDashboardResponse dto = new TournamentDashboardResponse();
        dto.setId(tournament.getId());
        dto.setName(tournament.getName());
        dto.setCoverImage(tournament.getCoverImage());
        dto.setStartDate(tournament.getStartDate());
        dto.setEndDate(tournament.effectiveEndDate());
        dto.setOriginalEndDate(tournament.getEndDate());
        dto.setVenue(tournament.getVenue());
        dto.setFinished(finished);
        dto.setTournamentStatus(finished ? TournamentStatus.FINISHED : tournament.getTournamentStatus());
        dto.setCanExtend(accessService.canExtendTournament(actor, tournament));

        List<TournamentDashboardResponse.ExtensionInfo> list = new ArrayList<>();
        if (tournament.getExtensions() != null) {
            for (TournamentExtension e : tournament.getExtensions()) {
                TournamentDashboardResponse.ExtensionInfo info = new TournamentDashboardResponse.ExtensionInfo();
                info.setPreviousEndDate(e.getPreviousEndDate());
                info.setNewEndDate(e.getNewEndDate());
                info.setReason(e.getReason());
                info.setExtendedByName(e.getExtendedByName());
                info.setExtendedAt(e.getExtendedAt() == null ? null : e.getExtendedAt().toString());
                list.add(info);
            }
        }
        dto.setExtensions(list);
        return dto;
    }

    public void createTournament(AddTournamentRequest addTournament, Authentication auth){

        boolean exists = tournamentRepository.existsByNameAndVenueAndStartDateAndEndDate(
                addTournament.getName(),
                addTournament.getVenue(),
                addTournament.getStartDate(),
                addTournament.getEndDate()
        );

        if (exists) {
            throw new RuntimeException("Tournament already exists with the same name, venue and dates.");
        }

        Tournament tournament = new Tournament();
        tournament.setName(addTournament.getName());
        tournament.setCoverImage(addTournament.getCoverImage());
        tournament.setOrganizerIds(addTournament.getOrganizerIds());
        tournament.setFormat(addTournament.getFormat());
        tournament.setStartDate(addTournament.getStartDate());
        tournament.setEndDate(addTournament.getEndDate());
        tournament.setVenue(addTournament.getVenue());
        tournament.setCreatedBy(accessService.actor(auth).profileIdOrNull()); // who made it = who may extend it
        LocalDate today = LocalDate.now();


        TournamentStatus status =today.isBefore(addTournament.getStartDate())
                        ? TournamentStatus.UPCOMING
                        : TournamentStatus.LIVE;

        tournament.setTournamentStatus(status);
        tournamentRepository.save(tournament);
    }

    /**
     * An organizer keeps a finished (or about to finish) tournament going.
     * A new end date and a reason are required; both are saved in the tournament's history.
     */
    public TournamentDashboardResponse extend(String tournamentId, ExtendTournamentRequest req, Authentication auth) {
        Tournament t = tournamentRepository.findTournamentById(tournamentId);
        if (t == null) throw new NoSuchElementException("Tournament not found");

        MatchAccessService.Actor actor = accessService.actor(auth);
        if (!accessService.canExtendTournament(actor, t)) {
            throw new AccessDeniedException("Only this tournament's organizers can extend it");
        }

        String reason = req == null || req.getReason() == null ? "" : req.getReason().trim();
        if (reason.length() < 5) throw new IllegalArgumentException("Write the reason for the extension (at least 5 characters)");
        if (reason.length() > 300) throw new IllegalArgumentException("The reason is too long (300 characters at most)");

        LocalDate newEnd = req == null ? null : req.getNewEndDate();
        if (newEnd == null) throw new IllegalArgumentException("Choose the new end date");

        LocalDate today = LocalDate.now();
        LocalDate currentEnd = t.effectiveEndDate();
        if (currentEnd != null && !newEnd.isAfter(currentEnd)) {
            throw new IllegalArgumentException("The new end date must be after the current end date (" + currentEnd + ")");
        }
        if (newEnd.isBefore(today)) {
            throw new IllegalArgumentException("The new end date must be today or later, otherwise the tournament is still finished");
        }
        if (newEnd.isAfter(today.plusYears(1))) {
            throw new IllegalArgumentException("The new end date can be at most one year from today");
        }

        TournamentExtension e = new TournamentExtension();
        e.setPreviousEndDate(currentEnd);
        e.setNewEndDate(newEnd);
        e.setReason(reason);
        e.setExtendedBy(actor.profileIdOrNull());
        e.setExtendedByName(accessService.displayName(actor.profileIdOrNull(), auth));
        e.setExtendedAt(Instant.now());

        List<TournamentExtension> list = t.getExtensions() == null ? new ArrayList<>() : new ArrayList<>(t.getExtensions());
        list.add(e);
        t.setExtensions(list);
        t.setTournamentStatus(t.getStartDate() != null && today.isBefore(t.getStartDate())
                ? TournamentStatus.UPCOMING : TournamentStatus.LIVE);
        tournamentRepository.save(t);

        liveScores.publishAll(); // lists unlock without a refresh
        return mapToDashboardResponse(t, actor);
    }

    /** True when the tournament exists and its (extended) end date is in the past. */
    public boolean isFinished(String tournamentId) {
        if (tournamentId == null) return false;
        Tournament t = tournamentRepository.findTournamentById(tournamentId);
        return t != null && t.finishedOn(LocalDate.now());
    }

    public List<String> venuesList(){
        return tournamentRepository.findAll().stream()
                .map(Tournament::getVenue)
                .collect(Collectors.toList());
    }

}
