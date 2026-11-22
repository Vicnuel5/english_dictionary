package com.example.backcore.repository;

import com.example.backcore.dto.DictionaryEntryDTO;
import com.example.backcore.dto.WordTypeDTO;
import java.util.List;
import org.springframework.jdbc.core.simple.JdbcClient;

/**
 * JDBC access to the dictionary table. The fully qualified annotation avoids a name
 * clash with this class's own name.
 */
@org.springframework.stereotype.Repository
public class Repository {

	private final JdbcClient jdbcClient;

	public Repository(JdbcClient jdbcClient) {
		this.jdbcClient = jdbcClient;
	}

	public void save(String word, String translation, short wordTypeId) {
		jdbcClient.sql("""
				INSERT INTO dictionary (word, translation, word_type_id)
				VALUES (:word, :translation, :wordTypeId)
				""")
				.param("word", word)
				.param("translation", translation)
				.param("wordTypeId", wordTypeId)
				.update();
	}

	public List<DictionaryEntryDTO> findByWordContaining(String query) {
		String pattern = "%" + query + "%";

		return jdbcClient.sql("""
				SELECT word, translation
				FROM dictionary
				WHERE word ILIKE :pattern
				ORDER BY word
				""")
				.param("pattern", pattern)
				.query((rs, rowNum) -> new DictionaryEntryDTO(
						rs.getString("word"),
						rs.getString("translation")))
				.list();
	}

	public List<WordTypeDTO> findAllWordTypes() {
		return jdbcClient.sql("""
				SELECT id, word_type
				FROM word_types
				ORDER BY word_type
				""")
				.query((rs, rowNum) -> new WordTypeDTO(
						rs.getShort("id"),
						rs.getString("word_type")))
				.list();
	}

	public void saveWordType(String wordType) {
		jdbcClient.sql("""
				INSERT INTO word_types (word_type)
				VALUES (:wordType)
				""")
				.param("wordType", wordType)
				.update();
	}

}
