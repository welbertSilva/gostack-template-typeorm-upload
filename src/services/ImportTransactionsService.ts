import { getCustomRepository, getRepository, In} from 'typeorm';
import csvParse from 'csv-parse';
import fs from 'fs';

import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';


interface CSVTransaction{
  title:string;
  type:'income' | 'outcome';
  value: number;
  category:string;
}

class ImportTransactionsService {
  async execute(filepath:string): Promise<Transaction[]> {

    const transactionRepository = getCustomRepository(TransactionsRepository);
    const categoryRepository = getRepository(Category);

    const  contactsReadStream =  fs.createReadStream(filepath);

    const parsers = csvParse({
      from_line: 2,
    });

    const parseCSV = contactsReadStream.pipe(parsers);

    const transactions: CSVTransaction[] = [];
    const catetgories:string[] = [];

    parseCSV.on('data', async line => {
      const [title, type, value, category] = line.map((cell:String) =>
      cell.trim(),
      );

      if (!title || !type || !value ) return;

      catetgories.push(category);
      transactions.push({title, type, value, category});
  });
      await new Promise(resolve => parseCSV.on('end', resolve));

      const existentCategories = await categoryRepository.find({
        where:{
          title: In (catetgories),
        },
      });

      const existentCategoriesTitles = existentCategories.map(
        (category:Category)=>category.title
      );

      const addCategoriesTitles = catetgories
      .filter(category=>!existentCategoriesTitles.includes(category))
      .filter((value, index, self)=>self.indexOf(value) === index); //retira os duplicados

    const newCatetgories = categoryRepository.create(
      addCategoriesTitles.map(title=>({
        title,
      })),
    );

    await categoryRepository.save(newCatetgories);
    const finalCategories = [...newCatetgories, ...existentCategories];

    const createTransactions = await transactionRepository.create(
      transactions.map((transaction)=>({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: finalCategories.find(category => category.title == transaction.category
       ),
      })),
    );
    await transactionRepository.save(createTransactions); // Persiste todas as transações criadas

    await fs.promises.unlink(filepath); //Exclui o arquivo importado

    return createTransactions;

  }
}

export default ImportTransactionsService;
