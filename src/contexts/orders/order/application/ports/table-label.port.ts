export abstract class TableLabelPort {
  abstract findLabelById(tableId: string): Promise<string | null>
}
