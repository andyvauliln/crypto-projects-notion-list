import fs from 'fs/promises';

class Logger {
  constructor() {
    this.logFile =
      '/Users/andreivaulin/Projects/crypto-projects-notion-list/log.txt';
    this.repositoryReport =
      '/Users/andreivaulin/Projects/crypto-projects-notion-list/reportRepo.json';
  }
  async cleanLogs() {
    await fs.writeFile(this.logFile, '');
    await fs.writeFile(this.repositoryReport, '{}');
  }

  async logInfo(message, isConsoleLog = true) {
    message =
      '******************************  MESSAGE  **********************\n\n\n' +
      message +
      '\n\n\n';
    await fs.appendFile(this.logFile, message);
    if (isConsoleLog) {
      console.dir(message, { depth: null });
    }
  }

  async logError(message) {
    message =
      '*******************************  ERROR  ************************\n\n\n' +
      message +
      '\n\n\n';
    await fs.appendFile(this.logFile, message);
    console.dir(message, { depth: null });
  }
  async makeReportForGitRepository(obj, err = '') {
    try {
      if (obj && Array.isArray(obj)) {
        const data = await fs.readFile(this.repositoryReport);
        let dataJson = JSON.parse(data);
        obj.forEach((item) => {
          dataJson[item.name] = { isAdded: false, url: item.url };
        });
        await fs.writeFile(this.repositoryReport, JSON.stringify(dataJson));
      } else if (obj) {
        const data = await fs.readFile(this.repositoryReport);
        let dataJson = JSON.parse(data);
        dataJson[obj.name].isAdded = true;
        dataJson[obj.name].url = obj.url;
        dataJson[obj.name].error = err;
        await fs.writeFile(this.repositoryReport, JSON.stringify(dataJson));
      }
    } catch (error) {
      this.logError('make report ' + error.message, error.stack);
    }

    return true;
  }
  // async makeFundMap(fund) {
  //   try {
  //     if (obj && Array.isArray(obj)) {
  //       const data = await fs.readFile(this.repositoryReport);
  //       let dataJson = JSON.parse(data);
  //       obj.forEach((item) => {
  //         dataJson[item.name] = { isAdded: false, url: item.url };
  //       });
  //       await fs.writeFile(this.repositoryReport, JSON.stringify(dataJson));
  //     } else if (obj) {
  //       const data = await fs.readFile(this.repositoryReport);
  //       let dataJson = JSON.parse(data);
  //       dataJson[obj.name].isAdded = true;
  //       dataJson[obj.name].url = obj.url;
  //       dataJson[obj.name].error = err;
  //       await fs.writeFile(this.repositoryReport, JSON.stringify(dataJson));
  //     }
  //   } catch (error) {
  //     this.logError('make fund map ' + error.message + "\n\n" + error.stack);
  //   }

  //   return true;
  // }
}
const LoggerInstance = new Logger();

export default LoggerInstance;
