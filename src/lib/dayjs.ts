import baseDayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import 'dayjs/locale/ru';

baseDayjs.extend(utc);

export const dayjs = baseDayjs;
