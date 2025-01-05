import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import Page from '../app/page'
 
describe('Page', () => {
  it('renders the home page', () => {
    render(<Page />)
    expect(screen.getByText(/Acessar/i)).toBeInTheDocument();
 
  })
})