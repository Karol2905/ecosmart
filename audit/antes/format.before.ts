// ❌ ANTES: moment.js + todos sus locales y lodash completo para 4 funciones utilitarias.
import moment from 'moment';
import 'moment/locale/es';
import _ from 'lodash';

moment.locale('es');

export const formatPrice = (cents: number): string =>
  '$ ' + _.round(cents / 100).toLocaleString('es-CO');

export const formatDate = (iso: string): string => moment(iso).format('D MMM YYYY');

export const fromNow = (iso: string): string => moment(iso).fromNow();

export const debounce = _.debounce;

export const sumBy = <T,>(items: readonly T[], pick: (item: T) => number): number => _.sumBy(items as T[], pick);
