import {
  addGroup,
  getPurchaseGroups,
  removeGroup,
  updateGroup,
  type Group,
} from '@/shared/lib/dbController/groups';

export class Groups {
  private _groups: Group[];

  private updateGroups = () => {
    this._groups = getPurchaseGroups(this.purchaseId);
  };

  constructor(private readonly purchaseId: number) {
    this._groups = $state(getPurchaseGroups(purchaseId));
  }

  get groups() {
    return this._groups;
  }

  addGroup = (group: Omit<Group, 'id'>) => {
    addGroup(group);
    this.updateGroups();
  };

  removeGroup = (groupId: number) => {
    removeGroup(groupId);
    this.updateGroups();
  };

  updateGroup = (group: Group) => {
    updateGroup(group);
    this.updateGroups();
  };
}
