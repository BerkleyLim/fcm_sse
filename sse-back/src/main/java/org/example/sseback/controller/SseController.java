package org.example.sseback.controller;

import org.example.sseback.entity.Board;
import org.example.sseback.entity.LogEntry;
import org.example.sseback.repository.BoardRepository;
import org.example.sseback.repository.LogEntryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

@RestController
public class SseController {

    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    @Autowired
    private LogEntryRepository logEntryRepository;

    @Autowired
    private BoardRepository boardRepository;

    @GetMapping("/subscribe")
    public SseEmitter subscribe() {
        SseEmitter emitter = new SseEmitter(60000L); // 60 seconds timeout
        emitters.add(emitter);

        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> emitters.remove(emitter));
        emitter.onError((ex) -> emitters.remove(emitter));

        return emitter;
    }

    @PostMapping("/create-board")
    public void createBoard(@RequestBody String boardName) {
        // 게시판 생성
        Board board = new Board(null, boardName);
        boardRepository.save(board);

        // 로그 저장
        LogEntry logEntry = new LogEntry(null, "Board created: " + boardName);
        logEntryRepository.save(logEntry);

        // 알림 전송
        sendNotification("게시판 '" + boardName + "'이(가) 생성되었습니다.");
    }

    @GetMapping("/boards")
    public List<Board> getBoards() {
        return boardRepository.findAll();
    }

    public void sendNotification(String message) {
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().data(message).name("message"));
            } catch (IOException e) {
                emitters.remove(emitter);
            }
        }
    }
}