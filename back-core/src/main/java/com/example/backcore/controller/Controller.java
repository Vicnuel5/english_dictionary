package com.example.backcore.controller;

import com.example.backcore.dto.DictionaryEntryDTO;
import com.example.backcore.dto.HelloDTO;
import com.example.backcore.dto.WordRequestDTO;
import com.example.backcore.service.Service;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class Controller {

	private static final Logger log = LoggerFactory.getLogger(Controller.class);

	private final Service service;

	public Controller(Service service) {
		this.service = service;
	}

	@GetMapping("/hello")
	public HelloDTO hello() {
		return new HelloDTO("hola");
	}

	@GetMapping("/words")
	public List<DictionaryEntryDTO> searchWords(
			@RequestParam(name = "q", defaultValue = "") String query) {
		return service.searchWords(query);
	}

	@PostMapping("/words")
	public ResponseEntity<Void> addWord(@RequestBody WordRequestDTO request) {
		log.info("Word received: word='{}', translation='{}'", request.word(), request.translation());
		service.addWord(request);
		return ResponseEntity.noContent().build();
	}

}
