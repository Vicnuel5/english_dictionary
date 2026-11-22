package com.example.backcore.repository;

import com.example.backcore.dto.DictionaryEntryDTO;
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

	public void save(String word, String translation) {
		jdbcClient.sql("""
				INSERT INTO dictionary (word, translation)
				VALUES (:word, :translation)
				""")
				.param("word", word)
				.param("translation", translation)
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

}
