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

	public List<DictionaryEntryDTO> findAll(int limit, long offset) {
		return jdbcClient.sql("""
				SELECT d.id, d.word, d.translation, d.word_type_id, wt.word_type
				FROM dictionary d
				JOIN word_types wt ON wt.id = d.word_type_id
				ORDER BY d.word, d.id
				LIMIT :limit OFFSET :offset
				""")
				.param("limit", limit)
				.param("offset", offset)
				.query((rs, rowNum) -> new DictionaryEntryDTO(
						rs.getLong("id"),
						rs.getString("word"),
						rs.getString("translation"),
						rs.getShort("word_type_id"),
						rs.getString("word_type")))
				.list();
	}

	public long countAll() {
		return jdbcClient.sql("""
				SELECT COUNT(*)
				FROM dictionary
				""")
				.query(Long.class)
				.single();
	}

	public List<DictionaryEntryDTO> findByWordContaining(String query, int limit, long offset) {
		String pattern = "%" + query + "%";

		return jdbcClient.sql("""
				SELECT d.id, d.word, d.translation, d.word_type_id, wt.word_type
				FROM dictionary d
				JOIN word_types wt ON wt.id = d.word_type_id
				WHERE d.word ILIKE :pattern
				ORDER BY d.word, d.id
				LIMIT :limit OFFSET :offset
				""")
				.param("pattern", pattern)
				.param("limit", limit)
				.param("offset", offset)
				.query((rs, rowNum) -> new DictionaryEntryDTO(
						rs.getLong("id"),
						rs.getString("word"),
						rs.getString("translation"),
						rs.getShort("word_type_id"),
						rs.getString("word_type")))
				.list();
	}

	public long countByWordContaining(String query) {
		String pattern = "%" + query + "%";

		return jdbcClient.sql("""
				SELECT COUNT(*)
				FROM dictionary
				WHERE word ILIKE :pattern
				""")
				.param("pattern", pattern)
				.query(Long.class)
				.single();
	}

	public boolean existsWord(long id) {
		return jdbcClient.sql("""
				SELECT EXISTS (SELECT 1 FROM dictionary WHERE id = :id)
				""")
				.param("id", id)
				.query(Boolean.class)
				.single();
	}

	public void updateWord(long id, String word, String translation, short wordTypeId) {
		jdbcClient.sql("""
				UPDATE dictionary
				SET word = :word,
				    translation = :translation,
				    word_type_id = :wordTypeId
				WHERE id = :id
				""")
				.param("word", word)
				.param("translation", translation)
				.param("wordTypeId", wordTypeId)
				.param("id", id)
				.update();
	}

	public void deleteWord(long id) {
		jdbcClient.sql("""
				DELETE FROM dictionary
				WHERE id = :id
				""")
				.param("id", id)
				.update();
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

	public boolean existsWordType(short id) {
		return jdbcClient.sql("""
				SELECT EXISTS (SELECT 1 FROM word_types WHERE id = :id)
				""")
				.param("id", id)
				.query(Boolean.class)
				.single();
	}

	public boolean existsWordTypeName(String wordType, short excludedId) {
		return jdbcClient.sql("""
				SELECT EXISTS (
					SELECT 1
					FROM word_types
					WHERE LOWER(word_type) = LOWER(:wordType)
					  AND id <> :excludedId
				)
				""")
				.param("wordType", wordType)
				.param("excludedId", excludedId)
				.query(Boolean.class)
				.single();
	}

	public void updateWordType(short id, String wordType) {
		jdbcClient.sql("""
				UPDATE word_types
				SET word_type = :wordType
				WHERE id = :id
				""")
				.param("wordType", wordType)
				.param("id", id)
				.update();
	}

	public boolean isWordTypeInUse(short id) {
		return jdbcClient.sql("""
				SELECT EXISTS (SELECT 1 FROM dictionary WHERE word_type_id = :id)
				""")
				.param("id", id)
				.query(Boolean.class)
				.single();
	}

	public void deleteWordType(short id) {
		jdbcClient.sql("""
				DELETE FROM word_types
				WHERE id = :id
				""")
				.param("id", id)
				.update();
	}

}
