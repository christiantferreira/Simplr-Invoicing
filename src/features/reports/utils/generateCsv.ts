import { unparse } from 'papaparse';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const generateCsv = (data: Record<string, any>[], fileName: string) => {
  const csv = unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${fileName}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};
