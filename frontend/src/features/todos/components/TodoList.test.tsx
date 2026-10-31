import { render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { todoFixture } from '../../../test/todoFixture'
import type { Todo } from '../types'
import { TodoList } from './TodoList'

vi.mock('../../../design-system', () => import('../../../design-system/mocks'))
vi.mock('./TodoEmptyState', () => ({
  TodoEmptyState: () => <p>Empty task list</p>,
}))
vi.mock('./TodoItem', () => ({ TodoItem: () => <li>Task</li> }))

function createProps(todos: Todo[] = []) {
  return {
    todos,
    hasTodos: todos.length > 0,
    loading: false,
    failed: false,
    busy: false,
    onCreate: vi.fn(),
    onToggle: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
  }
}

it('shows loading feedback before showing an empty list', () => {
  const props = createProps()
  const { rerender } = render(<TodoList {...props} loading />)

  expect(screen.getByRole('status')).toHaveTextContent('Loading your tasks…')
  expect(screen.queryByText('Empty task list')).not.toBeInTheDocument()

  rerender(<TodoList {...props} loading={false} />)

  expect(screen.queryByRole('status')).not.toBeInTheDocument()
  expect(screen.getByText('Empty task list')).toBeVisible()
})

it.each([
  { completed: [], active: 0, done: 0 },
  { completed: [false, false], active: 2, done: 0 },
  { completed: [false, true], active: 1, done: 1 },
  { completed: [true, true], active: 0, done: 2 },
])('shows correct task counts for %j', ({ completed, active, done }) => {
  const todos: Todo[] = completed.map((value, index) => ({
    ...todoFixture,
    id: index + 1,
    completed: value,
  }))

  render(<TodoList {...createProps(todos)} />)

  expect(
    screen.getByText(
      `Tasks shown: ${todos.length} · To do: ${active} · Completed: ${done}`,
    ),
  ).toBeVisible()
})

it.each([
  { loading: true, failed: false },
  { loading: false, failed: true },
])('hides the summary for %j', (state) => {
  render(<TodoList {...createProps([todoFixture])} {...state} />)

  expect(screen.queryByText(/Tasks shown:/)).not.toBeInTheDocument()
})