package com.appgym.social.application.dto;

public record SearchResultView(PersonView person, Relation relation) {

    public enum Relation {
        NONE,
        FRIEND,
        SENT,
        RECEIVED
    }
}
