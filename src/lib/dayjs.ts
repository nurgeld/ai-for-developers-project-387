import baseDayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import 'dayjs/locale/ru';

baseDayjs.extend(utc);
baseDayjs.locale('ru');

export const dayjs = baseDayjs;
