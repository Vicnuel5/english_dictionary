package com.example.backcore.service;

import com.example.backcore.dto.DictionaryEntryDTO;
import com.example.backcore.dto.WordRequestDTO;
import com.example.backcore.dto.WordTypeDTO;
import com.example.backcore.dto.WordTypeRequestDTO;
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
		if (request.word() == null || request.word().isBlank()
				|| request.translation() == null || request.translation().isBlank()
				|| request.wordTypeId() == null) {
			throw new IllegalArgumentException("Word, translation and word type are required.");
		}

		repository.save(
				request.word().trim(),
				request.translation().trim(),
				request.wordTypeId());
	}

	public List<DictionaryEntryDTO> searchWords(String query) {
		if (query == null || query.isBlank()) {
			return List.of();
		}

		return repository.findByWordContaining(query.trim());
	}

	public List<WordTypeDTO> listWordTypes() {
		return repository.findAllWordTypes();
	}

	public void addWordType(WordTypeRequestDTO request) {
		if (request.wordType() == null || request.wordType().isBlank()) {
			throw new IllegalArgumentException("Word type is required.");
		}

		repository.saveWordType(request.wordType().trim());
	}

}
