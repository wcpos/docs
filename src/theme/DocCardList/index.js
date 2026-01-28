import React from 'react';
import {
  useCurrentSidebarSiblings,
  filterDocCardListItems,
} from '@docusaurus/plugin-content-docs/client';
import DocCard from '@theme/DocCard';

function DocCardListForCurrentSidebarCategory({className, title}) {
  const items = useCurrentSidebarSiblings();
  return <DocCardList items={items} className={className} title={title} />;
}

export default function DocCardList(props) {
  const {items, className, title = 'In This Section'} = props;
  
  if (!items) {
    return <DocCardListForCurrentSidebarCategory {...props} />;
  }
  
  const filteredItems = filterDocCardListItems(items);
  
  return (
    <section className={className}>
      {title && <h2>{title}</h2>}
      <div className="link-cards">
        {filteredItems.map((item, index) => (
          <DocCard key={index} item={item} />
        ))}
      </div>
    </section>
  );
}
