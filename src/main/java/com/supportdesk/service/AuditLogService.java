package com.supportdesk.service;

import com.supportdesk.model.entity.AuditLog;
import com.supportdesk.repository.AuditLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    @Autowired
    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public List<AuditLog> getLogsForTicket(Long ticketId) {
        return auditLogRepository.findByTicketId(ticketId);
    }
}