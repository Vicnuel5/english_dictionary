package com.example.backcore.controller;

import com.example.backcore.dto.DictionaryEntryDTO;
import com.example.backcore.dto.HelloDTO;
import com.example.backcore.dto.PageResponseDTO;
import com.example.backcore.dto.WordRequestDTO;
import com.example.backcore.dto.WordTypeDTO;
import com.example.backcore.dto.WordTypeRequestDTO;
import com.example.backcore.service.Service;
import java.util.List;
import java.util.NoSuchElementException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
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
	public PageResponseDTO<DictionaryEntryDTO> searchWords(
			@RequestParam(name = "q", defaultValue = "") String query,
			@RequestParam(name = "page", defaultValue = "0") int page,
			@RequestParam(name = "size", defaultValue = "20") int size) {
		return service.searchWords(query, page, size);
	}

	@PostMapping("/words")
	public ResponseEntity<Void> addWord(@RequestBody WordRequestDTO request) {
		log.info("Word received: word='{}', translation='{}', wordTypeId='{}'",
				request.word(), request.translation(), request.wordTypeId());

		try {
			service.addWord(request);
			return ResponseEntity.noContent().build();
		} catch (IllegalArgumentException exception) {
			return ResponseEntity.badRequest().build();
		} catch (DataIntegrityViolationException exception) {
			return ResponseEntity.badRequest().build();
		}
	}

	@PutMapping("/words/{id}")
	public ResponseEntity<Void> updateWord(
			@PathVariable long id,
			@RequestBody WordRequestDTO request) {
		log.info("Word update received: id='{}', word='{}', translation='{}', wordTypeId='{}'",
				id, request.word(), request.translation(), request.wordTypeId());

		try {
			service.updateWord(id, request);
			return ResponseEntity.noContent().build();
		} catch (IllegalArgumentException exception) {
			return ResponseEntity.badRequest().build();
		} catch (NoSuchElementException exception) {
			return ResponseEntity.notFound().build();
		} catch (DataIntegrityViolationException exception) {
			return ResponseEntity.badRequest().build();
		}
	}

	@DeleteMapping("/words/{id}")
	public ResponseEntity<Void> deleteWord(@PathVariable long id) {
		log.info("Word delete received: id='{}'", id);

		try {
			service.deleteWord(id);
			return ResponseEntity.noContent().build();
		} catch (NoSuchElementException exception) {
			return ResponseEntity.notFound().build();
		}
	}

	@GetMapping("/word-types")
	public List<WordTypeDTO> listWordTypes() {
		return service.listWordTypes();
	}

	@PostMapping("/word-types")
	public ResponseEntity<Void> addWordType(@RequestBody WordTypeRequestDTO request) {
		try {
			service.addWordType(request);
			return ResponseEntity.noContent().build();
		} catch (IllegalArgumentException exception) {
			return ResponseEntity.badRequest().build();
		} catch (DuplicateKeyException exception) {
			return ResponseEntity.status(HttpStatus.CONFLICT).build();
		}
	}

	@PutMapping("/word-types/{id}")
	public ResponseEntity<Void> updateWordType(
			@PathVariable short id,
			@RequestBody WordTypeRequestDTO request) {
		log.info("Word type update received: id='{}', wordType='{}'", id, request.wordType());

		try {
			service.updateWordType(id, request);
			return ResponseEntity.noContent().build();
		} catch (IllegalArgumentException exception) {
			return ResponseEntity.badRequest().build();
		} catch (NoSuchElementException exception) {
			return ResponseEntity.notFound().build();
		} catch (IllegalStateException | DataIntegrityViolationException exception) {
			return ResponseEntity.status(HttpStatus.CONFLICT).build();
		}
	}

	@DeleteMapping("/word-types/{id}")
	public ResponseEntity<Void> deleteWordType(@PathVariable short id) {
		log.info("Word type delete received: id='{}'", id);

		try {
			service.deleteWordType(id);
			return ResponseEntity.noContent().build();
		} catch (NoSuchElementException exception) {
			return ResponseEntity.notFound().build();
		} catch (IllegalStateException | DataIntegrityViolationException exception) {
			return ResponseEntity.status(HttpStatus.CONFLICT).build();
		}
	}

}
