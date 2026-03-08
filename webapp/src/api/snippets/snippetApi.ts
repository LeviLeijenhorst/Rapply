import { createSnippetRemote, deleteSnippetRemote, updateSnippetRemote } from '../appData'

export const snippetApi = {
  create: createSnippetRemote,
  update: updateSnippetRemote,
  delete: deleteSnippetRemote,
}
