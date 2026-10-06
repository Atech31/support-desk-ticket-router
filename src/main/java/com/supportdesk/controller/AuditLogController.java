package com.supportdesk.controller;

import com.supportdesk.model.entity.AuditLog;
import com.supportdesk.service.AuditLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/audit-logs")
public class AuditLogController {

    private final AuditLogService auditLogService;

    @Autowired
    public AuditLogController(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    @GetMapping("/ticket/{ticketId}")
    public ResponseEntity<List<AuditLog>> getLogsForTicket(@PathVariable Long ticketId) {
        return ResponseEntity.ok(auditLogService.getLogsForTicket(ticketId));
    }
}