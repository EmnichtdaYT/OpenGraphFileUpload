CREATE TABLE users (
	username VARCHAR(20) PRIMARY KEY ON CONFLICT FAIL NOT NULL ON CONFLICT FAIL UNIQUE ON CONFLICT FAIL,
	password VARCHAR(80) NOT NULL ON CONFLICT FAIL, salt VARCHAR(5) NOT NULL ON CONFLICT FAIL )
WITHOUT ROWID;

CREATE TABLE tokens (
	user VARCHAR(20) NOT NULL ON CONFLICT FAIL,
	token VARCHAR(25) PRIMARY KEY ON CONFLICT FAIL NOT NULL ON CONFLICT FAIL UNIQUE ON CONFLICT FAIL,
	expire DATETIME NOT NULL ON CONFLICT FAIL, useragent TEXT NOT NULL ON CONFLICT FAIL,
	FOREIGN KEY ( user ) REFERENCES users ( username ) ON DELETE CASCADE ON UPDATE CASCADE )
WITHOUT ROWID;

CREATE TABLE files (
	id TEXT PRIMARY KEY ON CONFLICT FAIL NOT NULL ON CONFLICT FAIL,
	filename TEXT NOT NULL ON CONFLICT FAIL,
	parent TEXT NOT NULL ON CONFLICT FAIL REFERENCES folders ( id ) ON DELETE RESTRICT ON UPDATE CASCADE,
	owner VARCHAR(20) NOT NULL ON CONFLICT FAIL REFERENCES users ( username ) ON DELETE RESTRICT ON UPDATE CASCADE,
	UNIQUE ( filename, parent ) ON CONFLICT FAIL )
WITHOUT ROWID;

CREATE TABLE folders (
	id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL ON CONFLICT FAIL,
	name TEXT NOT NULL ON CONFLICT FAIL,
	parent TEXT NOT NULL ON CONFLICT FAIL REFERENCES folders ( id ) ON DELETE RESTRICT ON UPDATE CASCADE,
	owner VARCHAR(20) REFERENCES users ( username ) ON DELETE RESTRICT ON UPDATE CASCADE,
	UNIQUE ( name, parent ) ON CONFLICT FAIL );

INSERT INTO folders VALUES ( 0, 'files', 0, NULL );
