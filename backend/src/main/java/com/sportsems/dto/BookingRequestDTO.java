package com.sportsems.dto;

// Feature: multiple tickets per booking — lets a user request more than one
// seat/ticket for an event in a single booking call.
public class BookingRequestDTO {

    private Integer numberOfTickets = 1;

    public Integer getNumberOfTickets() { return numberOfTickets; }
    public void setNumberOfTickets(Integer numberOfTickets) { this.numberOfTickets = numberOfTickets; }
}
