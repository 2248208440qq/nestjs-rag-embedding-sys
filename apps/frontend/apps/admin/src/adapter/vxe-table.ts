import type { VxeTableGridOptions } from '@vben/plugins/vxe-table';

import type { ComponentPropsMap, ComponentType } from './component';

import { h } from 'vue';

import {
  setupVbenVxeTable,
  useVbenVxeGrid as useGrid,
} from '@vben/plugins/vxe-table';
import { VbenButton } from '@vben/common-ui';

import { ElImage } from 'element-plus';

import { useVbenForm } from './form';

setupVbenVxeTable({
  configVxeTable: (vxeUI) => {
    vxeUI.setConfig({
      grid: {
        align: 'center',
        border: false,
        columnConfig: {
          resizable: true,
        },
        minHeight: 180,
        formConfig: {
          // 全局禁用vxe-table的表单配置，使用formOptions
          enabled: false,
        },
        proxyConfig: {
          autoLoad: true,
          response: {
            result: 'items',
            total: 'total',
            list: 'items',
          },
          showActiveMsg: true,
          showResponseMsg: false,
        },
        round: true,
        showOverflow: true,
        size: 'small',
      } as VxeTableGridOptions,
    });

    // 表格配置项可以用 cellRender: { name: 'CellImage' },
    vxeUI.renderer.add('CellImage', {
      renderTableDefault(renderOpts, params) {
        const { props } = renderOpts;
        const { column, row } = params;
        const src = row[column.field];
        return h(ElImage, { src, previewSrcList: [src], ...props });
      },
    });

    // 表格配置项可以用 cellRender: { name: 'CellLink' },
    vxeUI.renderer.add('CellLink', {
      renderTableDefault(renderOpts) {
        const { props } = renderOpts;
        return h(
          VbenButton,
          { size: 'sm', variant: 'link' },
          { default: () => props?.text },
        );
      },
    });

    vxeUI.renderer.add('CellTag', {
      renderTableDefault(renderOpts, params) {
        const { options = [] } = renderOpts;
        const { column, row } = params;
        const value = row[column.field];
        const matched = options.find((item: { value: unknown }) => item.value === value);
        const label = matched?.label ?? value ?? '-';
        const type = matched?.type ?? value;
        const className =
          type === 'inactive' || type === 0
            ? 'border-muted bg-muted text-muted-foreground'
            : type === 'button'
              ? 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-300'
              : type === 'catalog'
                ? 'border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-300'
                : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300';

        return h(
          'span',
          {
            class: [
              'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium',
              className,
            ],
          },
          label,
        );
      },
    });

    // 这里可以自行扩展 vxe-table 的全局配置，比如自定义格式化
    // vxeUI.formats.add
  },
  useVbenForm,
});

export const useVbenVxeGrid = <T extends Record<string, any>>(
  ...rest: Parameters<typeof useGrid<T, ComponentType, ComponentPropsMap>>
) => useGrid<T, ComponentType, ComponentPropsMap>(...rest);

export type * from '@vben/plugins/vxe-table';
