import { createSnippetRemote, deleteSnippetRemote, updateSnippetRemote } from '../appData/appDataApi'

export const snippetApi = {
  create: createSnippetRemote,
  update: updateSnippetRemote,
  delete: deleteSnippetRemote,
}
