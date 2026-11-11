package com.CricLively.Websocket;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * Pushes "something changed" to everybody who is watching a match, so pages do not need a refresh.
 *
 * It sends only a tiny hint ("update:<matchId>"). The page then asks the normal REST API for the
 * fresh data, so the server stays the single source of truth and nothing can go out of sync.
 *
 * Messages from the browser (plain text):
 *   subscribe:<matchId>    watch one match
 *   subscribe:*            watch every match (used by the match lists)
 *   unsubscribe:<matchId>
 * Who may connect is decided in SecurityConfig (/ws/** = any logged-in person).
 */
@Component
public class LiveScoreHandler extends TextWebSocketHandler {

    private static final Pattern ID = Pattern.compile("^[A-Za-z0-9*_-]{1,64}$");
    private static final int MAX_SUBSCRIPTIONS_PER_SESSION = 10;

    private final Map<String, Set<WebSocketSession>> subscribers = new ConcurrentHashMap<>();

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        String text = message.getPayload().trim();
        if (text.startsWith("subscribe:")) {
            String id = text.substring("subscribe:".length());
            if (ID.matcher(id).matches() && subscriptionCount(session) < MAX_SUBSCRIPTIONS_PER_SESSION) {
                subscribers.computeIfAbsent(id, k -> ConcurrentHashMap.newKeySet()).add(session);
            }
        } else if (text.startsWith("unsubscribe:")) {
            Set<WebSocketSession> set = subscribers.get(text.substring("unsubscribe:".length()));
            if (set != null) set.remove(session);
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        subscribers.values().forEach(set -> set.remove(session));
    }

    /** One match changed: tell its watchers and everyone watching all matches. */
    public void publish(String matchId) {
        send(subscribers.get(matchId), "update:" + matchId);
        send(subscribers.get("*"), "update:" + matchId);
    }

    /** Something changed that is not about one match (e.g. a new match): tell the list watchers. */
    public void publishAll() {
        send(subscribers.get("*"), "update:*");
    }

    private int subscriptionCount(WebSocketSession session) {
        int n = 0;
        for (Set<WebSocketSession> set : subscribers.values()) if (set.contains(session)) n++;
        return n;
    }

    private void send(Set<WebSocketSession> sessions, String text) {
        if (sessions == null) return;
        TextMessage message = new TextMessage(text);
        for (WebSocketSession s : sessions) {
            try {
                if (s.isOpen()) {
                    synchronized (s) { // a session must not be written by two threads at once
                        s.sendMessage(message);
                    }
                } else {
                    sessions.remove(s);
                }
            } catch (IOException e) {
                sessions.remove(s);
            }
        }
    }
}
