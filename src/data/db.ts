import path from 'path'
import { AuthorObject, BookObject } from '../domain'
import { access, writeFile, readFile } from 'node:fs/promises'
import { constants } from 'node:fs'

export class DB {
	static instace: DB
	#authors: Map<string, AuthorObject> = new Map()
	#books: Map<string, BookObject> = new Map()
	#dbPath = path.resolve(__dirname, '.db.json')

	constructor() {
		if (!DB.instace) DB.instace = this
		return DB.instace
	}

	async save() {
		return writeFile(
			this.#dbPath,
			JSON.stringify({
				authors: [...this.#authors.entries()],
				books: [...this.#books.entries()],
			})
		)
	}

	async #load() {
		const readData = await readFile(this.#dbPath, 'utf8')
		this.#authors = new Map(
			Array.isArray(JSON.parse(readData).authors)
				? JSON.parse(readData).authors
				: new Map()
		)
		this.#books = new Map(
			Array.isArray(JSON.parse(readData).books)
				? JSON.parse(readData).books
				: new Map()
		)
	}

	async init(): Promise<void> {
		try {
			await access(this.#dbPath, constants.F_OK)
			await this.#load()
		} catch (err) {
			await this.save()
		}
	}

	async addBook(book: BookObject) {
		this.#books.set(book.id, book)
		await this.save()
		return book
	}

	async updateBook(bookId: string, updateData: Partial<BookObject>) {
		const currentBook = (await this.#books.get(bookId)) || {}
		delete updateData.id
		const newBook = { ...currentBook, ...updateData } as BookObject
		this.#books.set(bookId, newBook)
		await this.save()
		return newBook
	}

	async deleteBook(id: string) {
		this.#books.delete(id)
		await this.save()
	}

	async getBook(id: string) {
		return this.#books.get(id)
	}

	async listBooks() {
		return [...this.#books.values()]
	}
}
