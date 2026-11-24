package com.example.backcore.dto;

public record DictionaryEntryDTO(
		Long id,
		String word,
		String translation,
		Short wordTypeId,
		String wordType) {
}
