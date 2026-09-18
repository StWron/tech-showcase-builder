import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PageLibrary } from '@/components/PageLibrary';
import { SavedPageSummary } from '@/lib/page-store';

const pages: SavedPageSummary[] = [
  {
    id: 'a',
    title: '스마트 팩토리',
    category: '자동화',
    lastModified: '2026-06-01T00:00:00.000Z',
    blockCount: 5,
    disabledCount: 3,
  },
  {
    id: 'b',
    title: '센서 네트워크',
    category: '계측',
    lastModified: '2026-05-01T00:00:00.000Z',
    blockCount: 2,
    disabledCount: 0,
  },
];

const setup = (overrides: Partial<React.ComponentProps<typeof PageLibrary>> = {}) => {
  const props = {
    pages,
    currentPageId: 'b',
    onOpen: vi.fn(() => true),
    onDelete: vi.fn(() => true),
    onNew: vi.fn(),
    onRefresh: vi.fn(),
    ...overrides,
  };

  render(<PageLibrary {...props} />);
  return { props, user: userEvent.setup() };
};

const openLibrary = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: /보관함/ }));
};

describe('PageLibrary', () => {
  it('열 때 보관함을 다시 읽는다', async () => {
    const { props, user } = setup();
    await openLibrary(user);

    expect(props.onRefresh).toHaveBeenCalled();
  });

  it('저장된 페이지와 꺼진 권한 수를 보여준다', async () => {
    const { user } = setup();
    await openLibrary(user);

    expect(screen.getByText('스마트 팩토리')).toBeInTheDocument();
    expect(screen.getByText(/권한 3개 off/)).toBeInTheDocument();
  });

  it('편집 중인 페이지는 다시 열 수 없다', async () => {
    const { user } = setup();
    await openLibrary(user);

    const current = screen.getByText('센서 네트워크').closest('li') as HTMLElement;
    expect(within(current).getByRole('button', { name: '열기' })).toBeDisabled();
    expect(within(current).getByText('편집 중')).toBeInTheDocument();
  });

  it('열기를 누르면 해당 id로 연다', async () => {
    const { props, user } = setup();
    await openLibrary(user);

    const other = screen.getByText('스마트 팩토리').closest('li') as HTMLElement;
    await user.click(within(other).getByRole('button', { name: '열기' }));

    expect(props.onOpen).toHaveBeenCalledWith('a');
  });

  it('삭제는 확인을 거친다', async () => {
    const { props, user } = setup();
    await openLibrary(user);

    await user.click(screen.getByRole('button', { name: '스마트 팩토리 삭제' }));
    expect(props.onDelete).not.toHaveBeenCalled();

    expect(screen.getByText(/되돌릴 수 없습니다/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '삭제' }));

    expect(props.onDelete).toHaveBeenCalledWith('a');
  });

  it('확인 창에서 취소하면 지우지 않는다', async () => {
    const { props, user } = setup();
    await openLibrary(user);

    await user.click(screen.getByRole('button', { name: '스마트 팩토리 삭제' }));
    await user.click(screen.getByRole('button', { name: '취소' }));

    expect(props.onDelete).not.toHaveBeenCalled();
  });

  it('보관함이 비면 안내를 보여준다', async () => {
    const { user } = setup({ pages: [] });
    await openLibrary(user);

    expect(screen.getByText('저장된 페이지가 없습니다')).toBeInTheDocument();
  });

  it('새 페이지를 시작할 수 있다', async () => {
    const { props, user } = setup();
    await openLibrary(user);

    await user.click(screen.getByRole('button', { name: /새 페이지 시작/ }));
    expect(props.onNew).toHaveBeenCalled();
  });
});
