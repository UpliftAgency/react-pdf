import wrapPages from 'page-wrapping';

import Font from '../font';

class Document {
  static defaultProps = {
    author: null,
    keywords: null,
    subject: null,
    title: null,
  };

  addMetaData() {
    const { title, author, subject, keywords, creator, producer } = this.props;

    // The object keys need to start with a capital letter by the PDF spec
    if (title) this.root.instance.info.Title = title;
    if (author) this.root.instance.info.Author = author;
    if (subject) this.root.instance.info.Subject = subject;
    if (keywords) this.root.instance.info.Keywords = keywords;

    this.root.instance.info.Creator = creator || 'react-pdf';
    this.root.instance.info.Producer = producer || 'react-pdf';
  }

  getLayoutData() {
    return {
      type: this.name,
      children: this.subpages.map(c => c.getLayoutData()),
    };
  }

  async wrapPages() {
    let pageCount = 1;
    const pages = [];

    for (const page of this.children) {
      if (page.wrap) {
        const wrapArea = page.isAutoHeight
          ? Infinity
          : page.size.height - (page.style.paddingBottom || 0);

        const subpages = await wrapPages(page, wrapArea, pageCount);

        pageCount += subpages.length;

        pages.push(...subpages);
      } else {
        pages.push(page);
      }
    }

    return pages;
  }

  async renderPages() {
    this.subpages = await this.wrapPages();

    for (let j = 0; j < this.subpages.length; j++) {
      // Update dynamic text nodes with total pages info
      this.subpages[j].renderDynamicNodes(
        {
          pageNumber: j + 1,
          totalPages: this.subpages.length,
        },
        node => node.name === 'Text',
      );
      await this.subpages[j].render();
    }

    return this.subpages;
  }

  async render() {
    try {
      this.addMetaData();
      this.applyProps();
      await this.loadAssets();
      await this.renderPages();
      this.root.instance.end();
      Font.reset();
    } catch (e) {
      throw e;
    }
  }
}

export default Document;
