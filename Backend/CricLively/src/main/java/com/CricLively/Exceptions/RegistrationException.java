package com.CricLively.Exceptions;

import lombok.Getter;

@Getter
public class RegistrationException extends Exception {

    private final String exceptionCode;

    public RegistrationException( String message) {
        super(message);
        this.exceptionCode = this.getClass().getSimpleName();
    }

}

