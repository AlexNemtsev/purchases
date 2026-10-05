import { removeCategory } from '@/shared/lib/dbController/categories';
import {
  addOperation,
  getCategoryOperations,
  removeOperation,
  updateOperation,
  type NewOperation,
  type Operation,
} from '@/shared/lib/dbController/operations';

export class Store {
  private _operations: Operation[];

  constructor(categoryId: number) {
    this._operations = $state(getCategoryOperations(categoryId));
  }

  addOperation = (operation: NewOperation) => {
    const { id } = addOperation(operation);
    this._operations.push({ ...operation, id });
  };

  removeOperation = (id: number) => {
    removeOperation(id);
    this._operations = this._operations.filter((operation) => operation.id !== id);
  };

  updateOperation = (operation: Operation) => {
    updateOperation(operation);
    this._operations = this._operations.map((op) => (op.id === operation.id ? operation : op));
  };

  removeCategory = (id: number) => {
    removeCategory(id);
  };
}
