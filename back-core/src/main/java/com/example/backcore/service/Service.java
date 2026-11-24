package com.example.backcore.service;

import com.example.backcore.dto.DictionaryEntryDTO;
import com.example.backcore.dto.PageResponseDTO;
import com.example.backcore.dto.WordRequestDTO;
import com.example.backcore.dto.WordTypeDTO;
import com.example.backcore.dto.WordTypeRequestDTO;
import com.example.backcore.repository.Repository;
import java.util.List;
import java.util.NoSuchElementException;

/**
 * Business logic for words. The fully qualified annotation avoids a name clash
 * with this class's own name.
 */
@org.springframework.stereotype.Service
public class Service {

	private static final int DEFAULT_PAGE_SIZE = 20;
	private static final int MAX_PAGE_SIZE = 100;

	private final Repository repository;

	public Service(Repository repository) {
		this.repository = repository;
	}

	public void addWord(WordRequestDTO request) {
		validateWordRequest(request);

		repository.save(
				request.word().trim(),
				request.translation().trim(),
				request.wordTypeId());
	}

	public void updateWord(long id, WordRequestDTO request) {
		validateWordRequest(request);

		if (!repository.existsWord(id)) {
			throw new NoSuchElementException("Word not found.");
		}

		if (!repository.existsWordType(request.wordTypeId())) {
			throw new IllegalArgumentException("Word type not found.");
		}

		repository.updateWord(
				id,
				request.word().trim(),
				request.translation().trim(),
				request.wordTypeId());
	}

	public void deleteWord(long id) {
		if (!repository.existsWord(id)) {
			throw new NoSuchElementException("Word not found.");
		}

		repository.deleteWord(id);
	}

	private void validateWordRequest(WordRequestDTO request) {
		if (request == null || request.word() == null || request.word().isBlank()
				|| request.translation() == null || request.translation().isBlank()
				|| request.wordTypeId() == null) {
			throw new IllegalArgumentException("Word, translation and word type are required.");
		}
	}

	public PageResponseDTO<DictionaryEntryDTO> searchWords(String query, int page, int size) {
		int pageSize = size <= 0 ? DEFAULT_PAGE_SIZE : Math.min(size, MAX_PAGE_SIZE);
		int pageNumber = Math.max(page, 0);
		String trimmedQuery = query == null ? "" : query.trim();

		long totalElements = trimmedQuery.isEmpty()
				? repository.countAll()
				: repository.countByWordContaining(trimmedQuery);

		int totalPages = (int) ((totalElements + pageSize - 1) / pageSize);
		long offset = (long) pageNumber * pageSize;

		List<DictionaryEntryDTO> content = trimmedQuery.isEmpty()
				? repository.findAll(pageSize, offset)
				: repository.findByWordContaining(trimmedQuery, pageSize, offset);

		return new PageResponseDTO<>(content, pageNumber, pageSize, totalElements, totalPages);
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

	public void updateWordType(short id, WordTypeRequestDTO request) {
		if (request.wordType() == null || request.wordType().isBlank()) {
			throw new IllegalArgumentException("Word type is required.");
		}

		if (!repository.existsWordType(id)) {
			throw new NoSuchElementException("Word type not found.");
		}

		String wordType = request.wordType().trim();

		if (repository.existsWordTypeName(wordType, id)) {
			throw new IllegalStateException("Word type already exists.");
		}

		repository.updateWordType(id, wordType);
	}

	public void deleteWordType(short id) {
		if (!repository.existsWordType(id)) {
			throw new NoSuchElementException("Word type not found.");
		}

		if (repository.isWordTypeInUse(id)) {
			throw new IllegalStateException("Word type is in use.");
		}

		repository.deleteWordType(id);
	}

}
