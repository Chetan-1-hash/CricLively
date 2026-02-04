package com.CricLively.Exceptions;

import lombok.Getter;

@Getter
public class UpdateCricketDetailsException extends Exception{

    private final String exceptionCode;

    public UpdateCricketDetailsException(String message){
        super(message);
        this.exceptionCode = this.getClass().getSimpleName();
    }

}
