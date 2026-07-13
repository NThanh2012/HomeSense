import { PropertyStatus, PropertyType, TransactionType } from '@prisma/client';

export class PropertyEntity {
    id: string;
    title: string;
    transactionType: TransactionType;
    propertyType: PropertyType;
    status: PropertyStatus;
}
