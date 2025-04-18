import {
  DataGrid,
  DataGridHeader,
  DataGridRow,
  DataGridHeaderCell,
  DataGridBody,
  DataGridCell,
  TableCellLayout,
  TableColumnDefinition,
  createTableColumn,
  TableColumnId,
  Field,
  ProgressBar,
  tokens,
  Caption1,
  Text,
} from "@fluentui/react-components";

import type { ProcessItem } from "../../api/urbackupserver";
import { format_size, formatDuration } from "../../utils/format";
import { OngoingActivitiesActions } from "./OngoingActivitiesActions";
import { ProcessSpeedChart } from "./ProcessSpeedChart";
import { getCellFocusMode } from "../../utils/table";
import { ACTIONS } from "../../constants/ACTIONS";

const NUMBERED_ACTIONS_MAP = new Map([
  [0, ACTIONS.NONE],
  [1, ACTIONS.INCR_FILE],
  [2, ACTIONS.FULL_FILE],
  [3, ACTIONS.INCR_IMAGE],
  [4, ACTIONS.FULL_IMAGE],
  [5, ACTIONS.RESUME_INCR_FILE],
  [6, ACTIONS.RESUME_FULL_FILE],
  [8, ACTIONS.RESTORE_FILE],
  [9, ACTIONS.RESTORE_IMAGE],
  [10, ACTIONS.UPDATE],
  [11, ACTIONS.CHECK_INTEGRITY],
  [12, ACTIONS.BACKUP_DATABASE],
  [13, ACTIONS.RECALCULATE_STATISTICS],
  [14, ACTIONS.NIGHTLY_CLEANUP],
  [15, ACTIONS.EMERGENCY_CLEANUP],
  [16, ACTIONS.STORAGE_MIGRATION],
]);

const styles: Record<string, React.CSSProperties> = {
  progressField: {
    width: "100%",
  },
  progressWrapper: {
    width: "100%",
    paddingBlock: tokens.spacingVerticalM,
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXS,
  },
};

export const columns: TableColumnDefinition<ProcessItem>[] = [
  createTableColumn<ProcessItem>({
    columnId: "name",
    renderHeaderCell: () => {
      return "Computer name";
    },
    renderCell: (item) => {
      return <TableCellLayout>{item.name}</TableCellLayout>;
    },
  }),
  createTableColumn<ProcessItem>({
    columnId: "action",
    renderHeaderCell: () => {
      return "Action";
    },
    renderCell: (item) => {
      return (
        <TableCellLayout>
          {NUMBERED_ACTIONS_MAP.get(item.action)}
        </TableCellLayout>
      );
    },
  }),
  createTableColumn<ProcessItem>({
    columnId: "details",
    renderHeaderCell: () => {
      return "Details";
    },
    renderCell: (item) => {
      if (["0", ""].includes(item.details)) {
        return "-";
      }

      return (
        <TableCellLayout>
          <Caption1 block>Volume</Caption1>
          <Text>{item.details}</Text>
        </TableCellLayout>
      );
    },
  }),
  createTableColumn<ProcessItem>({
    columnId: "progress",
    renderHeaderCell: () => {
      return "Progress";
    },
    renderCell: (item) => {
      if (item.pcdone < 0) {
        return (
          <Field
            validationMessage="Indexing"
            validationState="none"
            style={styles.progressField}
          >
            <ProgressBar />
          </Field>
        );
      }

      return (
        <div style={styles.progressWrapper}>
          <Field
            validationMessage={`${item.pcdone}%`}
            validationState="none"
            style={styles.progressField}
          >
            <ProgressBar max={100} value={item.pcdone} />
          </Field>
          <Caption1>
            {format_size(item.done_bytes)} / {format_size(item.total_bytes)}
          </Caption1>
        </div>
      );
    },
  }),
  createTableColumn<ProcessItem>({
    columnId: "eta",
    renderHeaderCell: () => {
      return "ETA";
    },
    renderCell: (item) => {
      if (item.pcdone < 0 || item.pcdone === 100) {
        return "-";
      }

      return (
        <TableCellLayout>{formatDuration(item.eta_ms / 1000)}</TableCellLayout>
      );
    },
  }),
  createTableColumn<ProcessItem>({
    columnId: "speed",
    renderHeaderCell: () => {
      return "Speed";
    },
    renderCell: ProcessSpeedChart,
  }),
  createTableColumn<ProcessItem>({
    columnId: "queue",
    renderHeaderCell: () => {
      return <TableCellLayout>Files in Queue</TableCellLayout>;
    },
    renderCell: (item) => {
      return <TableCellLayout>{String(item.queue)}</TableCellLayout>;
    },
  }),
  createTableColumn<ProcessItem>({
    columnId: "actions",
    renderHeaderCell: () => {
      return "Actions";
    },
    renderCell: (item) => {
      return <OngoingActivitiesActions process={item} />;
    },
  }),
];

export function OngoingActivitiesTable({ data }: { data: ProcessItem[] }) {
  if (data.length === 0) {
    return <div>No activities</div>;
  }

  return (
    <DataGrid items={data} getRowId={(item) => item.id} columns={columns}>
      <DataGridHeader>
        <DataGridRow>
          {({ renderHeaderCell, columnId }) => (
            <DataGridHeaderCell style={getNarrowColumnStyles(columnId)}>
              {renderHeaderCell()}
            </DataGridHeaderCell>
          )}
        </DataGridRow>
      </DataGridHeader>
      <DataGridBody<ProcessItem>>
        {({ item }) => (
          <DataGridRow<ProcessItem> key={item.id}>
            {({ renderCell, columnId }) => (
              <DataGridCell
                focusMode={getCellFocusMode(columnId)}
                style={getNarrowColumnStyles(columnId)}
              >
                {renderCell(item)}
              </DataGridCell>
            )}
          </DataGridRow>
        )}
      </DataGridBody>
    </DataGrid>
  );
}

/**
 * Style some columns to take up less space.
 */
function getNarrowColumnStyles(columnId: TableColumnId) {
  const stringId = columnId.toString();

  return {
    flexGrow: ["queue", "eta"].includes(stringId) ? "0" : "1",
    flexBasis: ["queue", "eta"].includes(stringId) ? "12ch" : "0",
  };
}
