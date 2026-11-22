CREATE TABLE IF NOT EXISTS word_types (
    id SMALLSERIAL PRIMARY KEY,
    word_type VARCHAR(64) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS dictionary (
    id BIGSERIAL PRIMARY KEY,
    word TEXT NOT NULL,
    translation TEXT NOT NULL,
    word_type_id SMALLINT NOT NULL,
    
    FOREIGN KEY (word_type_id) REFERENCES word_types(id)
);
