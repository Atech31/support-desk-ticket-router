package com.supportdesk.model.enums;

public enum Priority {
    LOW(24),
    MEDIUM(12),
    HIGH(4),
    CRITICAL(2);

    private final int slaHours;

    Priority(int slaHours) {
        this.slaHours = slaHours;
    }

    public int getSlaHours() {
        return slaHours;
    }
}