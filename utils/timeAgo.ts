import moment from 'moment';

export const timeAgo = (date: string): string => {
    const reviewDate = moment(date);
    const now = moment();

    const diffDays = now.diff(reviewDate, 'days');
    const diffWeeks = now.diff(reviewDate, 'weeks');
    const diffMonths = now.diff(reviewDate, 'months');

    if (diffDays < 7) {
        return `${diffDays} gün önce`;
    } else if (diffWeeks < 4) {
        return `${diffWeeks} hafta önce`;
    } else {
        return `${diffMonths} ay önce`;
    }
};
