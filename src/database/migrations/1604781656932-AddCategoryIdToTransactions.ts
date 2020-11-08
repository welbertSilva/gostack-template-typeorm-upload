import {MigrationInterface, QueryRunner, TableColumn, TableForeignKey} from "typeorm";

export class AddCategoryIdToTransactions1604781656932 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn(
            'transactions',
                new TableColumn(
                    {
                        name:'category_id',
                        type:'uuid',
                        isNullable: true,
                    }
                )
        )
        await queryRunner.createForeignKey('transactions',
            new TableForeignKey(
                {   name:'FK_Transacions_Categories',
                    columnNames:['category_id'],
                    referencedColumnNames:['id',],
                    referencedTableName:'categories',
                    onDelete:'SET NULL',
                    onUpdate: 'CASCADE',
                }
            ),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropForeignKey('transactions','FK_Transacions_Categories');
        await queryRunner.dropColumn('transactions', 'category_id');
    };
}

