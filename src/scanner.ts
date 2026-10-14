export interface TodoItem {
	tag: string;
	text: string;
	line: number;
}

const TAG_REGEX = /\b(TODO|FIXME)\b:?\s*(.*)/;

export function findTodos(text: string): TodoItem[] {
	const result: TodoItem[] = [];
	const lines = text.split(/\r?\n/);

	for (let i = 0; i < lines.length; i++) {
		const match = TAG_REGEX.exec(lines[i]);

		if (match !== null) {
			result.push({
				tag: match[1],
				text: match[2].trim(),
				line: i,
			});
		}
	}

	return result;
}