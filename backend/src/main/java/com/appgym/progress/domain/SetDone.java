package com.appgym.progress.domain;

import java.math.BigDecimal;

public record SetDone(int position, Integer reps, BigDecimal load, Integer durationSeconds, Integer distanceMeters) {}
