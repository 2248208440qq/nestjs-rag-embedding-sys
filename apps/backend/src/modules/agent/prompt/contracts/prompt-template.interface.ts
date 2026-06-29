export interface PromptTemplate<TVariables> {
  name: string;
  render(variables: TVariables): string;
  version: string;
}
