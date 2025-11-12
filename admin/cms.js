(function () {
  const initCMS = () => {
    const { CMS } = window;
    if (!CMS) {
      window.setTimeout(initCMS, 50);
      return;
    }

    CMS.registerPreviewStyle('/admin/cms.css');

    CMS.registerEventListener({
      name: 'preSave',
      handler: ({ entry }) => {
        let updated = entry;
        const code = entry.getIn(['data', 'code']);
        const id = entry.getIn(['data', 'id']);
        if (!id && code) {
          updated = updated.setIn(['data', 'id'], code);
        }

        const categoryId = entry.getIn(['data', 'category_id']);
        const categoryAr = entry.getIn(['data', 'category_ar']);
        if (!categoryId && categoryAr) {
          updated = updated.setIn(['data', 'category_id'], categoryAr);
        }

        const discount = entry.getIn(['data', 'discount_price']);
        if (discount === null || discount === undefined || discount === '') {
          updated = updated.setIn(['data', 'discount_price'], 0);
        }

        const available = entry.getIn(['data', 'available']);
        if (available === null || available === undefined) {
          updated = updated.setIn(['data', 'available'], true);
        }

        return updated;
      },
    });

    CMS.registerEventListener({
      name: 'prePublish',
      handler: ({ entry }) => {
        let updated = entry;
        const cuts = entry.getIn(['data', 'cuts']);
        if (cuts && cuts.size) {
          updated = updated.setIn(
            ['data', 'cuts'],
            cuts.map((cut, index) => {
              if (!cut) {
                return cut;
              }
              let next = cut;
              const fallbackId = `${entry.getIn(['data', 'code']) || 'cut'}-${index + 1}`;
              if (!cut.get('id')) {
                next = next.set('id', fallbackId);
              }
              if (cut.get('name_ar')) {
                next = next.set('name_ar', cut.get('name_ar').trim());
              }
              if (cut.get('name_tr')) {
                next = next.set('name_tr', cut.get('name_tr').trim());
              }
              return next;
            }),
          );
        }
        return updated;
      },
    });

    CMS.init({ config: { load_config_file: true } });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCMS);
  } else {
    initCMS();
  }
})();
