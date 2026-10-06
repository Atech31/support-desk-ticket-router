package com.supportdesk.controller;

import com.supportdesk.model.entity.AuditLog;
import com.supportdesk.model.entity.Ticket;
import com.supportdesk.model.enums.Status;
import com.supportdesk.service.TicketService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

@RestController
@RequestMapping("/api/tickets")
@CrossOrigin(origins = "*")
public class TicketController {

    private final TicketService ticketService;

    // Track real-time SSE stream connections
    private final CopyOnWriteArrayList<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    @Autowired
    public TicketController(TicketService ticketService) {
        this.ticketService = ticketService;
    }

    // ==========================================
    // REAL-TIME SSE STREAM ENDPOINT
    // ==========================================

    @GetMapping(value = "/stream", produces = "text/event-stream")
    public SseEmitter streamTickets() {
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);
        emitters.add(emitter);

        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> emitters.remove(emitter));
        emitter.onError((e) -> emitters.remove(emitter));

        return emitter;
    }

    private void broadcastUpdate(Ticket ticket) {
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(ticket);
            } catch (Exception e) {
                emitters.remove(emitter);
            }
        }
    }

    // ==========================================
    // REST CONTROLLER ENDPOINTS
    // ==========================================

    @GetMapping
    public ResponseEntity<List<Ticket>> getAllTickets() {
        return ResponseEntity.ok(ticketService.getAllTickets());
    }

    @PostMapping
    public ResponseEntity<Ticket> createTicket(@RequestBody Ticket ticket) {
        Ticket createdTicket = ticketService.createTicket(ticket);
        broadcastUpdate(createdTicket);
        return ResponseEntity.ok(createdTicket);
    }

    @PutMapping("/{id}/assign")
    public ResponseEntity<Ticket> autoAssignTicket(@PathVariable Long id) {
        Ticket assignedTicket = ticketService.autoAssignAgent(id);
        broadcastUpdate(assignedTicket);
        return ResponseEntity.ok(assignedTicket);
    }

    @PutMapping("/{id}/assign-agent")
    public ResponseEntity<Ticket> assignAgent(
            @PathVariable Long id,
            @RequestParam Long agentId,
            @RequestParam(defaultValue = "SYSTEM") String updatedBy) {
        Ticket updatedTicket = ticketService.assignAgentToTicket(id, agentId, updatedBy);
        broadcastUpdate(updatedTicket);
        return ResponseEntity.ok(updatedTicket);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Ticket> updateStatus(
            @PathVariable Long id,
            @RequestParam Status status,
            @RequestParam(defaultValue = "SYSTEM") String updatedBy) {
        Ticket updatedTicket = ticketService.updateTicketStatus(id, status, updatedBy);
        broadcastUpdate(updatedTicket);
        return ResponseEntity.ok(updatedTicket);
    }

    @GetMapping("/status")
    public ResponseEntity<List<Ticket>> getTicketsByStatus(@RequestParam Status status) {
        return ResponseEntity.ok(ticketService.getTicketsByStatus(status));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTicket(@PathVariable Long id) {
        ticketService.deleteTicket(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/audit")
    public ResponseEntity<List<AuditLog>> getAuditLogs(@PathVariable Long id) {
        return ResponseEntity.ok(ticketService.getAuditLogsByTicketId(id));
    }
}