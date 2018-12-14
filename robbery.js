'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = true;
const datePattern = new RegExp('(.*?)?\\s?(\\d{2}):(\\d{2})\\+(\\d+)');
const minutesInDay = 24 * 60;
const minutesInHour = 60;
const dayToNumber = {
    'ПН': 0,
    'ВТ': 1,
    'СР': 2
};
const numberToDay = {
    0: 'ПН',
    1: 'ВТ',
    2: 'СР'
};

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */
function getAppropriateMoment(schedule, duration, workingHours) {
    console.info(schedule, duration, workingHours);
    const bankTimeZone = parseInt(datePattern.exec(workingHours.from)[4]);
    // console.info('timezone', bankTimeZone)
    const scheduleDate = covnvertScheduleToMinutes(schedule, bankTimeZone);
    const bankSchedule = getWorkingHours(workingHours, bankTimeZone);
    // console.info('bank schedule', bankSchedule);
    const freeSchedule = getFreeTimeSchedule(scheduleDate);
    // console.info('freeschedule', freeSchedule);
    let intervals = getScheduleIntersection(freeSchedule, bankSchedule)
        .filter(interval =>
            interval.to - interval.from >= duration);
    // console.info(intervals);

    return {
        shift: 30,

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return intervals.length > 0;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например, "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (!this.exists()) {
                return '';
            }
            let interval = intervals[0];
            let day = Math.floor(interval.from / (24 * 60));
            let weekDay = numberToDay[day];
            let hours = Math.floor((interval.from / 60)) % 24;
            hours = hours < 10 ? `0${hours}` : hours;
            let minutes = interval.from % 60;
            minutes = minutes < 10 ? `0${minutes}` : minutes;
            template = template
                .replace('%DD', weekDay)
                .replace('%HH', hours)
                .replace('%MM', minutes);

            return template;
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (!this.exists()) {
                return false;
            }

            if (intervals[0].to - intervals[0].from >= duration + this.shift) {
                intervals[0].from += this.shift;

                return true;
            }
            if (intervals.length === 1) {
                return false;
            }

            intervals.shift();

            return true;
        }
    };
}

function compareIntervals(a, b) {
    return a.from > b.from;
}

function isTimeSuits(a, b) {
    return (a.to >= b.from && a.to <= b.to) ||
        (a.from >= b.from && a.from <= b.to) ||
        (a.from <= b.from && a.to >= b.to);
}
function getScheduleIntersection(gangSchedule, bankSchedule) {
    Object
        .keys(gangSchedule)
        .forEach(member => {
            let count = bankSchedule.length;
            gangSchedule[member]
                .forEach(freeTime => {
                    bankSchedule
                        .forEach(workingHours => {
                            if (isTimeSuits(freeTime, workingHours)) {
                            // console.info(bankSchedule)
                            // console.info(freeTime)
                                let start = Math.max(freeTime.from, workingHours.from);
                                let end = Math.min(freeTime.to, workingHours.to);
                                bankSchedule.push({
                                    from: start,
                                    to: end
                                });
                            // console.info(bankSchedule)
                            }
                        });

                });
            bankSchedule.splice(0, count);
        });

    return bankSchedule;
}

function getFreeTimeSchedule(schedule) {
    Object
        .keys(schedule)
        .forEach(e => schedule[e].sort(compareIntervals));
    const freeSchedule = [];
    Object
        .keys(schedule)
        .forEach(member => {
            freeSchedule[member] = [];
            let start = 0;
            schedule[member]
                .forEach(interval => {
                    freeSchedule[member].push({
                        from: start,
                        to: interval.from
                    });
                    start = interval.to;
                });
            freeSchedule[member].push({
                from: start,
                to: 60 * 24 * 3
            });
        });

    return freeSchedule;
}

function convertDateToMinutes(date, bankTimeZone) {
    const match = datePattern.exec(date);
    const hourShift = bankTimeZone - parseInt(match[4]);
    const dayShift = dayToNumber[match[1]] * minutesInDay;
    const hours = parseInt(match[2]) + hourShift;
    const minutes = parseInt(match[3]);

    return dayShift + hours * minutesInHour + minutes;
}

function covnvertScheduleToMinutes(gangSchedule, bankTimeZone) {
    const gangScheduleInMinutes = [];
    Object
        .keys(gangSchedule)
        .forEach(member => {
            gangScheduleInMinutes[member] = [];
            gangSchedule[member]
                .map(interval => gangScheduleInMinutes[member].push(
                    {
                        from: convertDateToMinutes(interval.from, bankTimeZone),
                        to: convertDateToMinutes(interval.to, bankTimeZone)
                    }

                ));
        });

    return gangScheduleInMinutes;
}

function getWorkingHours(workingHours, bankTimeZone) {
    const bankSchedule = [];
    Object
        .keys(dayToNumber)
        .forEach(day => bankSchedule.push(
            {
                from: convertDateToMinutes(day + ' ' + workingHours.from,
                    bankTimeZone),
                to: convertDateToMinutes(day + ' ' + workingHours.to,
                    bankTimeZone)
            }
        ));

    return bankSchedule;
}

module.exports = {
    getAppropriateMoment,

    isStar
};
