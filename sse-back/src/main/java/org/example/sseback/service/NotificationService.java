package org.example.sseback.service;

import org.example.sseback.controller.SseController;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {

    @Autowired
    private SseController sseController;

    public void triggerEvent() {
        sseController.sendNotification("새로운 이벤트가 발생했습니다!");
    }
}