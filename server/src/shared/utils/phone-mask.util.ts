export const parseVietnamesePhone = (content: string): string | null => {
    const phoneMatch = content.match(/(?:\+84|0)(?:[\s.-]?\d){9,10}/);
    if (!phoneMatch) {
        return null;
    }

    const compactPhone = phoneMatch[0].replace(/[\s.-]/g, '');
    if (compactPhone.startsWith('+84')) {
        return `0${compactPhone.slice(3)}`;
    }

    return compactPhone;
};

export const maskPhone = (phone: string): string => {
    if (phone.length < 7) {
        return phone;
    }

    return `${phone.slice(0, 4)}***${phone.slice(-3)}`;
};
