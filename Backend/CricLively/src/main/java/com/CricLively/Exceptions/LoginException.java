package com.CricLively.Exceptions;

public class LoginException extends Exception {

    private final String exceptionCode;

    public LoginException(String message) {
        super(message);
        this.exceptionCode = this.getClass().getSimpleName();
    }

}
