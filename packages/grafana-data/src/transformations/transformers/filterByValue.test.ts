import { mockTransformationsRegistry } from '../../utils/tests/mockTransformationsRegistry';
import { Field, FieldType } from '../../types';
import { ArrayVector } from '../../vector';
import { transformDataFrame } from '../transformDataFrame';
import { toDataFrame } from '../../dataframe/processDataFrame';
import { ValueFilterID, valueFiltersRegistry } from '../valueFilters';
import { filterByValueTransformer } from './filterByValue';
import { DataTransformerID } from './ids';

const seriesAWithSingleField = toDataFrame({
  name: 'A',
  length: 7,
  fields: [
    { name: 'time', type: FieldType.time, values: new ArrayVector([1000, 2000, 3000, 4000, 5000, 6000, 7000]) },
    { name: 'numbers', type: FieldType.number, values: new ArrayVector([1, 2, 3, 4, 5, 6, 7]) },
  ],
});

describe('FilterByValue transformer', () => {
  beforeAll(() => {
    mockTransformationsRegistry([filterByValueTransformer]);
  });

  it('should exclude values', () => {
    const valueFilters = [
      {
        type: 'exclude',
        fieldName: 'numbers',
        filterExpression: '5',
        filterType: ValueFilterID.lowerOrEqual,
      },
    ];

    const cfg = {
      id: DataTransformerID.filterByValue,
      options: {
        valueFilters,
      },
    };

    const processed = transformDataFrame([cfg], [seriesAWithSingleField]);
    const expected: Field[] = [
      {
        name: 'time',
        type: FieldType.time,
        values: new ArrayVector([6000, 7000]),
        state: { displayName: 'time' },
        config: {},
      },
      {
        name: 'numbers',
        type: FieldType.number,
        values: new ArrayVector([6, 7]),
        state: { displayName: 'numbers' },
        config: {},
      },
    ];

    expect(processed.length).toEqual(1);
    expect(processed[0].fields).toEqual(expected);
  });

  it('should include values', () => {
    const valueFilters = [
      {
        type: 'include',
        fieldName: 'numbers',
        filterExpression: '5',
        filterType: ValueFilterID.lowerOrEqual,
      },
    ];

    const cfg = {
      id: DataTransformerID.filterByValue,
      options: {
        valueFilters,
      },
    };

    const processed = transformDataFrame([cfg], [seriesAWithSingleField]);
    const expected: Field[] = [
      {
        name: 'time',
        type: FieldType.time,
        values: new ArrayVector([1000, 2000, 3000, 4000, 5000]),
        state: { displayName: 'time' },
        config: {},
      },
      {
        name: 'numbers',
        type: FieldType.number,
        values: new ArrayVector([1, 2, 3, 4, 5]),
        state: { displayName: 'numbers' },
        config: {},
      },
    ];

    expect(processed.length).toEqual(1);
    expect(processed[0].fields).toEqual(expected);
  });

  it('should chain properly all the filters', () => {
    const valueFilters = [
      {
        type: 'exclude',
        fieldName: 'numbers',
        filterExpression: '2',
        filterType: ValueFilterID.greater,
      },
      {
        type: 'include',
        fieldName: 'numbers',
        filterExpression: '4',
        filterType: ValueFilterID.lowerOrEqual,
      },
      {
        type: 'include',
        fieldName: 'numbers',
        filterExpression: '7',
        filterType: ValueFilterID.equal,
      },
    ];

    const cfg = {
      id: DataTransformerID.filterByValue,
      options: {
        valueFilters,
      },
    };

    const processed = transformDataFrame([cfg], [seriesAWithSingleField]);
    const expected: Field[] = [
      {
        name: 'time',
        type: FieldType.time,
        values: new ArrayVector([1000, 2000, 3000, 4000, 7000]),
        state: { displayName: 'time' },
        config: {},
      },
      {
        name: 'numbers',
        type: FieldType.number,
        values: new ArrayVector([1, 2, 3, 4, 7]),
        state: { displayName: 'numbers' },
        config: {},
      },
    ];

    expect(processed.length).toEqual(1);
    expect(processed[0].fields).toEqual(expected);
  });
});