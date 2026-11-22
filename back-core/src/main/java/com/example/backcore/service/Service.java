package com.example.backcore.service;

import com.example.backcore.dto.DictionaryEntryDTO;
import com.example.backcore.dto.WordRequestDTO;
import com.example.backcore.repository.Repository;
import java.util.List;

/**
 * Business logic for words. The fully qualified annotation avoids a name clash
 * with this class's own name.
 */
@org.springframework.stereotype.Service
public class Service {

	private final Repository repository;

	public Service(Repository repository) {
		this.repository = repository;
	}

	public void addWord(WordRequestDTO request) {
		repository.save(request.word(), request.translation());
	}

	public List<DictionaryEntryDTO> searchWords(String query) {
		if (query == null || query.isBlank()) {
			return List.of();
		}

		return repository.findByWordContaining(query.trim());
	}

}
