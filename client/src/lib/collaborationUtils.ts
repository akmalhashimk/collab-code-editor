// Operational Transform utilities for collaborative editing

export interface Operation {
  type: 'insert' | 'delete' | 'retain';
  position: number;
  content?: string;
  length?: number;
}

export interface TextOperation {
  ops: Operation[];
  version: number;
}

export class OperationalTransform {
  static transform(op1: Operation, op2: Operation): [Operation, Operation] {
    if (op1.type === 'insert' && op2.type === 'insert') {
      if (op1.position <= op2.position) {
        return [
          op1,
          { ...op2, position: op2.position + (op1.content?.length || 0) }
        ];
      } else {
        return [
          { ...op1, position: op1.position + (op2.content?.length || 0) },
          op2
        ];
      }
    }
    
    if (op1.type === 'delete' && op2.type === 'delete') {
      if (op1.position <= op2.position) {
        return [
          op1,
          { ...op2, position: Math.max(op2.position - (op1.length || 0), op1.position) }
        ];
      } else {
        return [
          { ...op1, position: op1.position - Math.min(op2.length || 0, op1.position - op2.position) },
          op2
        ];
      }
    }
    
    if (op1.type === 'insert' && op2.type === 'delete') {
      if (op1.position <= op2.position) {
        return [
          op1,
          { ...op2, position: op2.position + (op1.content?.length || 0) }
        ];
      } else {
        return [
          { ...op1, position: Math.max(op1.position - (op2.length || 0), op2.position) },
          op2
        ];
      }
    }
    
    if (op1.type === 'delete' && op2.type === 'insert') {
      if (op2.position <= op1.position) {
        return [
          { ...op1, position: op1.position + (op2.content?.length || 0) },
          op2
        ];
      } else {
        return [
          op1,
          { ...op2, position: Math.max(op2.position - (op1.length || 0), op1.position) }
        ];
      }
    }
    
    return [op1, op2];
  }

  static applyOperation(text: string, operation: Operation): string {
    switch (operation.type) {
      case 'insert':
        return text.slice(0, operation.position) + 
               (operation.content || '') + 
               text.slice(operation.position);
      
      case 'delete':
        return text.slice(0, operation.position) + 
               text.slice(operation.position + (operation.length || 0));
      
      case 'retain':
        return text;
      
      default:
        return text;
    }
  }

  static createInsertOperation(position: number, content: string): Operation {
    return {
      type: 'insert',
      position,
      content
    };
  }

  static createDeleteOperation(position: number, length: number): Operation {
    return {
      type: 'delete',
      position,
      length
    };
  }
}

export function generateOperationFromChange(
  oldText: string, 
  newText: string
): Operation | null {
  if (oldText === newText) return null;
  
  // Find the first difference
  let start = 0;
  while (start < oldText.length && start < newText.length && oldText[start] === newText[start]) {
    start++;
  }
  
  // Find the last difference
  let oldEnd = oldText.length;
  let newEnd = newText.length;
  while (oldEnd > start && newEnd > start && oldText[oldEnd - 1] === newText[newEnd - 1]) {
    oldEnd--;
    newEnd--;
  }
  
  if (oldEnd === start && newEnd === start) {
    return null; // No changes
  }
  
  if (oldEnd === start) {
    // Insert operation
    return OperationalTransform.createInsertOperation(start, newText.slice(start, newEnd));
  }
  
  if (newEnd === start) {
    // Delete operation
    return OperationalTransform.createDeleteOperation(start, oldEnd - start);
  }
  
  // Replace operation (delete + insert)
  // For simplicity, we'll just return the insert operation
  // In a full implementation, you'd want to handle this as two operations
  return OperationalTransform.createInsertOperation(start, newText.slice(start, newEnd));
}

export function transformCursorPosition(
  position: { line: number; column: number },
  operation: Operation,
  text: string
): { line: number; column: number } {
  const lines = text.split('\n');
  let characterPosition = 0;
  
  // Convert line/column to absolute position
  for (let i = 0; i < position.line - 1; i++) {
    characterPosition += lines[i].length + 1; // +1 for newline
  }
  characterPosition += position.column - 1;
  
  // Apply transformation based on operation
  let newCharacterPosition = characterPosition;
  
  if (operation.type === 'insert') {
    if (operation.position <= characterPosition) {
      newCharacterPosition += operation.content?.length || 0;
    }
  } else if (operation.type === 'delete') {
    if (operation.position < characterPosition) {
      newCharacterPosition = Math.max(
        newCharacterPosition - (operation.length || 0),
        operation.position
      );
    }
  }
  
  // Convert back to line/column
  const newText = OperationalTransform.applyOperation(text, operation);
  const newLines = newText.split('\n');
  let currentPosition = 0;
  
  for (let i = 0; i < newLines.length; i++) {
    if (currentPosition + newLines[i].length >= newCharacterPosition) {
      return {
        line: i + 1,
        column: newCharacterPosition - currentPosition + 1
      };
    }
    currentPosition += newLines[i].length + 1;
  }
  
  return { line: 1, column: 1 };
  }
