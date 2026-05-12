const log = (MESSAGE) => console.log(MESSAGE)
// GLOBAL VARS
const D = document
/** Smart selector for elements of the DOM
 * @param {DOMString}
 * @param {Element} optional
 * @return {Element}
 */
const $ = (element, _parent = D) => {
	const callback = _parent
	if(typeof _parent == 'function') {
		_parent = D
	}
	const xElements = _parent.querySelectorAll(element)
	const length = xElements.length
	element = element.charAt(0) === '#' && !/\s/.test(element) || length === 1 ? _parent.querySelector(element) : length === 0 ? undefined : xElements
	if(typeof callback == 'function') {
		if(element) {
			if('' + element == '[object NodeList]') {
				element.forEach(function(e) {
					callback(e)
				})
			} else {
				callback(element)
			}
		}
	} else {
		return element
	}
}
/** Smart selector for elements of the DOM
 * @param {DOMString}
 * @return {Element}
 */
const new$ = (element, append = 'body') => {
	let $temp = D.createElement(element)
	$(append).appendChild($temp)
	return $temp
}
//---------------------
document.addEventListener('DOMContentLoaded', () => {
	const $itemsContainer = $('#items');
	const $editor = $('#editor');
	const $addTextTabButton = $('#addTextTab');
	const $addFolderTabButton = $('#addFolderTab');
	const $currentDirectory = $('#currentDirectory');
	const $clearAll = $('#clearAll');
	const $menu = $('#menu')
	const $explorer = $('#explorer')
	const $backgroundExplorer = $('#backgroundExplorer')

	function toggleMenu() {
		if($backgroundExplorer.style.display == 'none') {
		  $explorer.style.translate = '0'
		  
			$backgroundExplorer.style.display = 'block'
			$backgroundExplorer.style.opacity = '1'
			
		} else {
		  $explorer.style.translate = '-100vw 0'
			$backgroundExplorer.style.display = 'none'
			$backgroundExplorer.style.opacity = '0'
		}
	}
	$menu.onclick = toggleMenu
	$backgroundExplorer.onclick = toggleMenu
	let cutTabId = null;
	let activeTabId = null;
	let editedTabs = JSON.parse(localStorage.getItem('tabs')) || [];
	let tabs = JSON.parse(localStorage.getItem('items')) || [];
	
	let currentTabId = localStorage.getItem('currentTabId');
	
	$clearAll.onclick = () => {
		showConfirmationDialog('ALL THE PROYECT', () => {
			localStorage.setItem('items', '[]')
			localStorage.setItem('tabs', '[]')
			localStorage.setItem('currentTabId', 0)
			window.location.href = window.location.href
		});
	}





// Función para buscar un archivo o carpeta por su ruta
function findTabByPath(path, currentDir = tabs) {
    // Dividimos la ruta en partes para navegar
    let pathParts = path.split('/');

    // Recursivamente buscamos en la estructura
    for (let part of pathParts) {
        let found = currentDir.find(item => item.name === part);
        if (found) {
            // Si encontramos una carpeta, actualizamos el directorio actual
            if (found.type === 'folder') {
                currentDir = found.contents; // Navegamos a la carpeta
            } else {
                return found; // Retornamos el archivo encontrado
            }
        } else {
            // Si no encontramos el archivo o carpeta, retornamos null
            return null;
        }
    }
    return null; // Si no se encuentra nada
}


  
function getFileContent(path, currentDir = tabs, currentFolder = null, callingFile = '') {
    path = path
        .toLowerCase()
        .replace('.txt', '') // Quitamos la extensión .txt
        .replace(/\\/g, '/')
        .replace(/^\.\//m, '');

    // Si estamos dentro de una carpeta y el archivo está en la misma carpeta
    if (currentFolder) {
        let foundInFolder = currentFolder.contents.find(item => item.name.toLowerCase() === path);
        if (foundInFolder) {
            return `// OPEN '${path}.txt'\n${processImports(foundInFolder.content, currentDir, currentFolder, path)}\n// CLOSE '${path}.txt'`;
        }
    }

    // Si no está en la misma carpeta, seguimos buscando en la estructura principal
    let pathParts = path.split('/');
    for (let part of pathParts) {
        let found = currentDir.find(item => item.name.toLowerCase() === part);
        if (found) {
            if (found.type === 'folder') {
                currentDir = found.contents; // Navegamos dentro de la carpeta
            } else if (found.type === 'text') {
                return `// OPEN '${path}'\n${processImports(found.content, currentDir, currentFolder, path)}\n// CLOSE '${path}'`;
            }
        } else {
            // Manejo del error: archivo no encontrado
            window.navigator.vibrate(200);
            showToast(`File "${path}.txt" not found while importing from "${callingFile}.txt".`, 'fail', 5000);
            return null;
        }
    }
    return null;
}


  // Función recursiva para procesar las importaciones
function processImports(content, currentDir, currentFolder, callingFile) {
    let directiveRegex = /\{\$I\s+([^\s]+)\}/ig;

    return content.replace(directiveRegex, (match, path) => {
        // Usamos currentFolder para importar dentro de la misma carpeta
        let importedContent = getFileContent(path, currentDir, currentFolder, callingFile);
        
        return importedContent !== null ? importedContent : match;
    });
}
  
function compileFile() {
    // Encontramos el archivo abierto
    let openTab = findTabById(currentTabId, tabs);
    if (!openTab) {
        alert('Current file not found.');
        return;
    }

    // Calculamos la carpeta padre del archivo abierto
    let parentFolder = findParentFolder(openTab.id, tabs);

    // Obtenemos el contenido del archivo y procesamos las importaciones
    let finalContent = processImports(openTab.content, tabs, parentFolder, openTab.name);

    // Imprimimos el resultado final
    if (!/\{\$I\s+([^\s]+)\}/i.test(finalContent)){
      showToast(`Compiled project!`)
      return finalContent
    }
    return null
}
  
  // Event listener para el botón "compile"
  document.getElementById('compile').addEventListener('click', function() {
    console.log(compileFile());
  });








	function Explorer_Save() {
		localStorage.setItem('items', JSON.stringify(tabs));
	}

	function saveCurrentTabId(id) {
		localStorage.setItem('currentTabId', id);
	}

	function Items_render() {
		$itemsContainer.innerHTML = '';
		if(tabs == '') tabs = []
		const sortedTabs = Item_Sort(tabs);
		sortedTabs.forEach(tab => Explorer_render(tab, $itemsContainer));
		updateMoveToRootButtonVisibility();
		renderEditedTabs();
	}

	function renderEditedTabs() {
		const $tabsContainer = $('#tabsContainer');
		$tabsContainer.innerHTML = '';
		editedTabs.forEach(tab => {
			const $tabButton = new$('button');
			$tabButton.textContent = `📄 ${tab.name}.txt`;
			$tabButton.onclick = () => {
				Item_Select(tab.id);
				updateActiveTab(tab.id);
			};
			$tabButton.className = 'upperTab'
			
			const $closeButton = new$('button');
			$closeButton.className = 'closeTab';
			$closeButton.textContent = '×';
			$closeButton.onclick = (event) => {
				event.stopPropagation();
				Tab_Remove(tab.id);
			};
			$tabButton.appendChild($closeButton);
			$tabsContainer.appendChild($tabButton);
			// Estilo para la pestaña activa
			if(tab.id === activeTabId) {
				$tabButton.classList.add('active')
			}
		});
	}

	function updateActiveTab(tabId) {
    activeTabId = tabId;
    renderEditedTabs();
    const tab = findTabById(tabId, tabs);
    if (tab && tab.type === 'text') {
        $editor.value = tab.content; // Cargar el nuevo contenido en el editor
    }
}

	function saveTabContent() {
		const tab = findTabById(activeTabId, tabs);
		if(tab) {
			tab.content = $editor.value;
			Explorer_Save();
			Tab_Add(tab);
		}
	}
	/** Quita una pestaña de ID escogido
	 * @param {Number} id
	 */
	window.Tab_Remove = function(id) {
		editedTabs = editedTabs.filter(tab => tab.id !== id);
		localStorage.setItem('tabs', JSON.stringify(editedTabs));
		renderEditedTabs();
	}
	/** Añade una pestaña a la lista de pestañas editadas y actualiza el almacenamiento local y la interfaz.
	 * @param {Object} tab
	 */
	function Tab_Add(tab) {
		if(!editedTabs.some(t => t.id === tab.id)) {
			editedTabs.push(tab);
			localStorage.setItem('tabs', JSON.stringify(editedTabs));
			renderEditedTabs();
		}
	}

	function Item_Sort(tabList) {
		return tabList.slice().sort((a, b) => {
			if(a.type === 'folder' && b.type !== 'folder') return -1;
			if(a.type !== 'folder' && b.type === 'folder') return 1;
			return a.name.localeCompare(b.name);
		}).map(tab => {
			if(tab.type === 'folder' && tab.contents) {
				return {
					...tab,
					contents: Item_Sort(tab.contents)
				};
			}
			return tab;
		});
	}

	function Explorer_render(tab, $container, parentFolderId = null) {
		const $tabElement = new$('div');
		$tabElement.className = tab.type === 'folder' ? 'folder' : 'tab';
		const isCut = cutTabId === tab.id;
		const isActive = activeTabId === tab.id;
		
		const cutButton = !isCut && (!parentFolderId || parentFolderId !== tab.id) && tabs.some(t => t.type === 'folder' && t.id !== tab.id) ? `<button onclick="Item_cutTab(${tab.id})">✄ Curt</button>` : '';
		
		const pasteButton = tab.type === 'folder' && cutTabId !== null && !isDescendant(cutTabId, tab.id) && cutTabId !== tab.id ? `<button onclick="Item_Paste(${tab.id})">⎗ Paste</button>` : '';
		
		const cancelCutButton = isCut ? `<button onclick="Item_cancelCut()">↶ Cancel</button>` : '';
		
		const moveToParentButton = parentFolderId ? `<button onclick="Item_moveToParent(${tab.id}, ${parentFolderId})">⇠ Descend</button>` : '';
		
		const childCount = tab.type === 'folder' ? `<sup>${tab.contents.length}</sup>` : '';
		
		const deleteButton = `<button onclick="
          window.navigator.vibrate(200);
          showConfirmationDialog('${tab.name}', ()=>{
            Tab_Remove(${tab.id});
            Item_Remove(${tab.id});
          });"
        >✖ Delete</button>`
        
		const downloadButton = tab.type === 'text' ? `<button onclick="File_download(${tab.id})">⬇ Download</button>` : '';
		
		const uploadButton = tab.type === 'folder' ? `<button onclick="File_upload(${tab.id})">⇪ Upload</button>` : '';
		
		$tabElement.innerHTML = `
      <span ${tab.type === 'folder' ? 'onclick="Item_toggleFolder(' + tab.id + ')"' : ''}>
          ${tab.type === 'folder' ?  (tab.expanded ? '📂' : '📁') : '📄'}
          ${tab.name}${childCount}${tab.type === 'folder' ? '<span class="indicator"></span>' : '.txt'}
      </span>
      
      <span class="dropdown">
        <button class='for-open'>⋯</button>
        <div class="content">
          ${tab.type === 'folder'
            ? '<button onclick="Explorer_addItem(' + tab.id
            + ', `text`)">+ New File</button>'
            + '<button onclick="Explorer_addItem(' + tab.id
            + ', `folder`)">+ New Folder</button>'
            + uploadButton
            + '<hr>'
            : ''}
          <button onclick="Item_rename(${tab.id});">✎ Rename</button>
          ${cutButton}
          ${pasteButton}
          ${cancelCutButton}
          ${moveToParentButton}
          <hr>
          ${downloadButton}
          ${deleteButton}
        </div>
      </span>
    `;
		if(isActive) {
			$tabElement.style.backgroundColor = '#E6E6FA17'; // Violeta claro para la pestaña activa
		} else {
			$tabElement.style.backgroundColor = ''; // Fondo normal para pestañas no activas
		}
		$tabElement.onclick = (event) => {
			if(currentTabId != tab.id) {
				event.stopPropagation();
				if(tab.type === 'text') {
					Item_Select(tab.id);
				}
			}
		};
		$container.appendChild($tabElement);
		if(tab.type === 'folder' && tab.contents && tab.expanded) {
			const $folderContents = new$('div');
			$folderContents.className = 'folder-contents';
			tab.contents.forEach(subTab => Explorer_render(subTab, $folderContents, tab.id));
			$container.appendChild($folderContents);
		}
	}

	function removeTab(tabId) {
		// Eliminar la pestaña del array de pestañas
		tabs = tabs.filter(tab => tab.id !== tabId);
		// Eliminar la pestaña de las carpetas, si es necesario
		tabs.forEach(tab => {
			if(tab.type === 'folder') {
				tab.contents = tab.contents.filter(content => content.id !== tabId);
			}
		});
		// Si la pestaña eliminada es la pestaña activa, actualizar la pestaña activa
		if(activeTabId === tabId) {
			activeTabId = null;
		}
		// Eliminar la pestaña de las pestañas editadas
		editedTabs = editedTabs.filter(tab => tab.id !== tabId);
		Tab_Remove(tabId)
		Explorer_Save();
		Items_render();
		renderEditedTabs(); // Asegurarse de que la barra de pestañas activas se actualice
	}

	function updateMoveToRootButtonVisibility() {
		const $moveToRootButton = $('#moveToRootButton');
		if(cutTabId !== null) {
			$moveToRootButton.style.display = 'inline';
		} else {
			$moveToRootButton.style.display = 'none';
		}
	}

	function tabHasYourItem(_items, _tabs) {
		// Crear un Set con los IDs del primer array
		const work = new Set(_items.map(obj => obj.id));
		// Filtrar los objetos del segundo array que tienen un ID presente en el primer array
		const matching = _tabs.filter(obj => work.has(obj.id));
		// Retornar el nuevo array con los objetos coincidentes
		return matching;
	}

function findParentFolder(childId, tabList) {
	  for (let tab of tabList) {
	    if (tab.type === 'folder' && tab.contents.some(subTab => subTab.id === childId)) {
	      return tab;
	    }
	    if (tab.type === 'folder') {
	      const found = findParentFolder(childId, tab.contents);
	      if (found) return found;
	    }
	  }
	  return null;
	}
	window.Item_cutTab = function(id) {
		cutTabId = id;
		Items_render();
	};
	window.Item_cancelCut = function() {
		cutTabId = null;
		Items_render();
	};

window.getFileSize = function(content) {
        return new Blob([content]).size; // Calcula el tamaño en bytes del contenido
    }

window.Item_moveToParent = function(id, parentFolderId) {
		// Sobrescribir el contenido de la pestaña existent
		const tabToMove = findTabById(id, tabs);
		const parentFolder = findParentFolder(parentFolderId, tabs);
		
		
		// Verificar si existe un archivo con el mismo nombre en el directorio padre
    let conflictingTab = null;
    
    if (parentFolder) {
        conflictingTab = parentFolder.find(tab =>
          tab.name === tabToMove.name &&
          tab.type === tabToMove.type
        );
    } else {
        conflictingTab = tabs.find(tab =>
          tab.name === tabToMove.name &&
          tab.type === tabToMove.type
        );
    }
    
		if (conflictingTab) {
  	  const tabToMoveSize = getFileSize(tabToMove.content);
  	  const conflictingTabSize = getFileSize(conflictingTab.content);
	
	    openModal('⚠️ File Conflict',
	      `There is already a file named "${tabToMove.name}" in the parent folder. Do you want to replace it?

<br><br>${conflictingTabSize} bytes will be lost
<br>${tabToMoveSize} bytes will be added

<br><br><b>This action cannot be undone</b>`,
	      null, 'Replace', 'Cancel')
	    .then(confirmOverwrite => {
	      if (confirmOverwrite) {
	        // Eliminar ambos archivos
	        Item_Remove(tabToMove.id); // Eliminar el archivo que se va a mover de su ubicación original
	        Item_Remove(conflictingTab.id); // Eliminar el archivo en conflicto
	
	        // Crear un nuevo archivo con la información del archivo movido
	        const newTab = {
	          ...tabToMove, // Copiar la información del archivo que se va a mover
	          id: id, // Generar un nuevo ID único
	        };
	
	        if (parentFolder) {
	          parentFolder.contents.push(newTab); // Añadir el nuevo archivo en la carpeta padre
	        } else {
	          tabs.push(newTab); // Añadir el nuevo archivo a la raíz si no hay carpeta padre
	        }
	        Item_Select(id)
	
	        cutTabId = null; // Cancelar la acción de cortar
	        Explorer_Save();
	        Items_render();
	        showToast('Successfully replaced!')
	      } else {
	        // Si el usuario cancela la operación
	        cutTabId = null;
	        Explorer_Save();
	        Items_render();
	      }
	    });
	} else {
	  Item_Remove(id); // Eliminar el archivo que se va a mover de su ubicación original
	  
	  // Si no hay conflicto, mover el archivo normalmente
	  if (parentFolder) {
	    parentFolder.contents.push(tabToMove); // Mover el archivo a la carpeta padre
	  } else {
	    tabs.push(tabToMove); // Mover el archivo a la raíz si no hay carpeta padre
	  }
	
	  Item_Select(id)
	  cutTabId = null; // Cancelar la acción de cortar
	  
	  
	  updateMoveToRootButtonVisibility();
	    updatePlaceholder();
	    Items_render();
	    renderEditedTabs();
	    Explorer_Save();
	    showToast('Successfully moved!')
	}
	};
	
	
window.Item_Paste = function(folderId) {
	  // Guardar la información del archivo a cortar
	  const cutTab = findTabById(cutTabId, tabs);
	  const folder = findTabById(folderId, tabs);
	  if (!cutTab || !folder || folder.type !== 'folder') return;
	
	  // Guardar la información del archivo con el que entra en conflicto (si existe)
	    const conflictingTab = folder.contents.find(tab => tab.name === cutTab.name && tab.type === cutTab.type);
	    
	    // Variable para determinar si alguno de los archivos estaba seleccionado
	    const wasSelected = (activeTabId === cutTab.id || (conflictingTab && activeTabId === conflictingTab.id));
	    
	    if (conflictingTab) {
  	  const tabToMoveSize = getFileSize(cutTab.content);
  	  const conflictingTabSize = getFileSize(conflictingTab.content);
  	  
	    // Si existe un conflicto, preguntar si se desea sobrescribir
	    openModal('⚠️ File Conflict',
	      `There is already a file named "${tabToMove.name}" in the parent folder. Do you want to replace it?

<br><br>${conflictingTabSize} bytes will be lost
<br>${tabToMoveSize} bytes will be added

<br><br><b>This action cannot be undone</b>`,
	      null, 'Replace', 'Cancel')
	      .then(confirmOverwrite => {
	        if (confirmOverwrite) {
	          // Eliminar ambos archivos
	          removeTab(cutTab.id); // Eliminar el archivo cortado de su ubicación original
	          removeTab(conflictingTab.id); // Eliminar el archivo en conflicto
	
	          // Crear un nuevo archivo con la información del archivo cortado
	          const newTab = {
	            ...cutTab, // Copiar la información del archivo cortado
	            id: Date.now(), // Nuevo ID único
	          };
	          folder.contents.push(newTab); // Añadir el nuevo archivo a la carpeta
	
	          // Si alguno de los archivos estaba seleccionado, seleccionar el nuevo archivo
	          if (wasSelected) {
	            activeTabId = newTab.id;
	            Item_Select(newTab.id); // Seleccionar el nuevo archivo
	          }
	
	          cutTabId = null; // Cancelar la acción de cortar
	          updateMoveToRootButtonVisibility();
	          updatePlaceholder();
	          Items_render();
	          renderEditedTabs();
	          saveTabContent();
	          Explorer_Save();
	          showToast('Successfully replaced!')
	        } else {
	          // Si se cancela la sobrescritura
	          Item_cancelCut();
	          updateMoveToRootButtonVisibility();
	        }
	      });
	  } else {
	    // Si no hay conflicto, mover el archivo normalmente
	    const cutTab = findAndRemoveTabById(cutTabId, tabs);
	    folder.contents.push(cutTab);
	    folder.expanded = true;
	    cutTabId = null;
	    updateMoveToRootButtonVisibility();
	    updatePlaceholder();
	    Items_render();
	    renderEditedTabs();
	    Explorer_Save();
	    showToast('Successfully moved!')
	  }
	};

	function isDescendant(parentId, childId) {
		const parent = findTabById(parentId, tabs);
		if(!parent || parent.type !== 'folder') return false;
		for(let subTab of parent.contents) {
			if(subTab.id === childId) return true;
			if(subTab.type === 'folder' && isDescendant(subTab.id, childId)) return true;
		}
		return false;
	}
	window.moveCutTabToRoot = function() {
    if (cutTabId !== null) {
        // Guardar la información del archivo a mover
        const cutTab = findTabById(cutTabId, tabs);
        
        // Verificar si existe un archivo con el mismo nombre en la raíz
        const conflictingTab = tabs.find(tab =>
          tab.name === cutTab.name 
          && tab.type === cutTab.type
          && tab.id !== cutTab.id
        );
        
        // Variable para determinar si el archivo cortado o el archivo en conflicto está seleccionado
        const wasSelected = (activeTabId === cutTab.id || (conflictingTab && activeTabId === conflictingTab.id));

        if (conflictingTab) {
            const cutTabSize = getFileSize(cutTab.content);
            const conflictingTabSize = getFileSize(conflictingTab.content);

            // Si existe un conflicto, pedir confirmación al usuario
            openModal('⚠️ File Conflict',
`There is already a file named "${cutTab.name}" in the root. Do you want to replace it?

<br><br>${conflictingTabSize} bytes will be lost
<br>${cutTabSize} bytes will be added

<br><br><b>This action cannot be undone</b>`,
              null, 'Replace', 'Cancel')
            .then(confirmOverwrite => {
                if (confirmOverwrite) {
                    // Eliminar ambos archivos
                    Item_Remove(cutTab.id); // Eliminar el archivo cortado de su ubicación original
                    Item_Remove(conflictingTab.id); // Eliminar el archivo en conflicto

                    // Crear un nuevo archivo en la raíz con los datos del archivo cortado
                    const newTab = {
                        ...cutTab, // Copiar la información del archivo cortado
                        id: Date.now(), // Generar un nuevo ID único
                    };
                    tabs.push(newTab); // Añadir el nuevo archivo a la raíz

                    // Si alguno de los archivos estaba seleccionado, seleccionar el nuevo archivo
                    if (wasSelected) {
                        activeTabId = newTab.id;
                        Item_Select(newTab.id); // Seleccionar el nuevo archivo
                    }

                    cutTabId = null; // Cancelar la acción de cortar
                    updateMoveToRootButtonVisibility();
                    updatePlaceholder();
                    Items_render();
                    renderEditedTabs();
                    saveTabContent();
                    Explorer_Save();
                    showToast('Successfully replaced!')
                } else {
                    // Si se cancela la sobrescritura
                    Item_cancelCut();
                    updateMoveToRootButtonVisibility();
                }
            });
        } else {
            // Si no hay conflicto, mover el archivo a la raíz normalmente
            const cutTab = findAndRemoveTabById(cutTabId, tabs);
            tabs.push(cutTab);
            cutTabId = null; // Cancelar la acción de cortar
            updateMoveToRootButtonVisibility();
            updatePlaceholder();
            Items_render();
            renderEditedTabs();
            Explorer_Save();
            showToast('Successfully moved!')
        }
    }
};


	window.showConfirmationDialog = function(elementName, callback) {
		const currentNumber = Math.floor(Math.random() * 900) + 100;
		
		openModal('⚠️ ALERT',
`<b>Are you sure you want to delete "${elementName}"?</b> This action cannot be undone. Enter the number <b>${currentNumber}</b> to confirm.`,
'number', 'Accept', 'Cancel')
    .then(userNumber => {
		  if (userNumber == null)return;
		  
      if(userNumber === currentNumber.toString()) {
		  	callback();
		  }
		  if (elementName != 'ALL THE PROYECT')
		    showToast('Successfully removed!')
    })
	}

	function findAndRemoveTabById(id, tabList) {
		for(let i = 0; i < tabList.length; i++) {
			if(tabList[i].id === id) {
				return tabList.splice(i, 1)[0];
			}
			if(tabList[i].type === 'folder') {
				const found = findAndRemoveTabById(id, tabList[i].contents);
				if(found) return found;
			}
		}
		return null;
	}
	window.Item_toggleFolder = function(id) {
		const folder = findTabById(id, tabs);
		folder.expanded = !folder.expanded;
		Explorer_Save();
		Items_render();
	};

	function Item_Select(id) {
		currentTabId = id
		const tab = findTabById(id, tabs);
		if(tab) {
			if(tab.type === 'text') {
				activeTabId = id;
				$editor.value = tab.content;
				saveCurrentTabId(id);
				Items_render();
				Tab_Add(tab);
				$editor.disabled = false;
			} else {
				$editor.disabled = true
				$editor.value = '';
			}
		}
		updatePlaceholder()
	}
	window.Item_Remove = function(id) {
		tabs = deleteTabById(id, tabs)
		editedTabs = tabHasYourItem(tabs, editedTabs)
		localStorage.setItem('tabs', JSON.stringify(editedTabs))
		Explorer_Save()
		if(id == currentTabId) {
			$editor.value = ''
			currentTabId = null
		}
		if(id == cutTabId) {
			cutTabId = null
		}
		updateMoveToRootButtonVisibility()
		updatePlaceholder()
		Items_render()
		renderEditedTabs()
	};

	function updatePlaceholder() {
		// Uso de la función
		if(countTextFiles(tabs) != 0) {
			$editor.placeholder = '✨ Choose a file to get started ✨';
			if(doesTabExist(currentTabId, tabs)) {
				$editor.placeholder = 'You’re all set! 📝 Start writing...';
			}
		} else {
			$editor.placeholder = '🌟 Create your first file and bring your ideas to life 🌟';
		}
		$currentDirectory.textContent = getCurrentFileLocation(currentTabId, tabs)
	}

	function doesTabExist(id, tabList) {
		for(let tab of tabList) {
			if(tab.id === id) {
				return true;
			}
			if(tab.type === 'folder' && tab.contents) {
				if(doesTabExist(id, tab.contents)) {
					return true;
				}
			}
		}
		return false;
	}
	/**
	 * Returns a message indicating the current file being edited and its location.
	 * @param {number} currentTabId - The ID of the currently active tab.
	 * @param {Array} tabs - The array of all tabs.
	 * @return {string} - A message indicating the file name and its location.
	 */
	function getCurrentFileLocation(currentTabId, tabs) {
		const tab = findTabById(currentTabId, tabs);
		if(!tab) {
			return 'No file is currently being edited.';
		}
		let location = tab.name;
		let parentFolder = findParentFolder(tab.id, tabs);
		while(parentFolder) {
			location = `${parentFolder.name}  >  ${location}`;
			parentFolder = findParentFolder(parentFolder.id, tabs);
		}
		return location + '.txt'
	}

	function isTabNameTaken(name, type) {
		return tabs.some(tab => tab.name === name && tab.type === type);
	}

function generateUniqueId() {
    return Math.floor(Math.random() * Date.now());
}

function generateUniqueName(baseName, type, existingTabs) {
		let count = 0;
		let uniqueName = baseName;
		while(existingTabs.some(tab => tab.name === uniqueName && tab.type === type)) {
			count++;
			uniqueName = `${baseName} (${count})`;
		}
		return uniqueName;
	}

function Explorer_addText() {
  openModal('New File', 'Enter a Name or Path<br>(e.g., "src/main")', 'text', 'Create', 'Cancel',
  generateUniqueName('New file', 'text', tabs))
  .then(path => {
    if (path == null) return;

    // Reemplazar barras invertidas '\' con barras normales '/'
    path = path.replace(/\\/g, '/');

    // Dividir la ruta en carpetas y archivo
    const pathParts = path.split('/');
    const fileName = pathParts.pop(); // El último elemento es el nombre del archivo
    let currentFolder = tabs; // Empezamos en la raíz

    // Crear las carpetas si no existen
    for (let folderName of pathParts) {
      let folder = currentFolder.find(tab => tab.name === folderName && tab.type === 'folder');

      if (!folder) {
        // Si la carpeta no existe, crearla
        const newFolder = {
          id: generateUniqueId(),
          name: folderName,
          type: 'folder',
  			contents: [],
  			expanded: true,
        };
        currentFolder.push(newFolder);
        currentFolder = newFolder.contents; // Navegar dentro de la nueva carpeta
      } else {
        // Si la carpeta ya existe, navegar dentro de ella
        currentFolder = folder.contents;
      }
    }

    // Verificar si ya existe un archivo con el mismo nombre en la carpeta actual
    const existingFile = currentFolder.find(tab => tab.name === fileName && tab.type === 'text');
    if (existingFile) {
      showToast(`The file "${fileName}" already exists in this folder.`, 'fail', 5000);
      return;
    }

    // Crear el archivo dentro de la carpeta adecuada
    const id = generateUniqueId();
    currentFolder.push({
      id,
      name: fileName,
      type: 'text',
      content: ''
    });

    // Guardar cambios y actualizar la interfaz
    Explorer_Save();
    Items_render();
    Item_Select(id); // Seleccionar automáticamente la nueva pestaña para editarla
    updateActiveTab(id); // Actualizar la pestaña activa
    updatePlaceholder();
  });
}

	function Explorer_addFolder() {
	  openModal('New Folder', `Enter a name`,
'text', 'Create', 'Cancel',
	    generateUniqueName('New folder', 'folder', tabs)
	  ).then(name =>{
		  if (name == null)return;
	  
  		const id = Date.now();
  		tabs.push({
  			id,
  			name,
  			type: 'folder',
  			contents: [],
  			expanded: true
  		});
  		Explorer_Save();
  		Items_render();
	  })
	}
	
	window.addTabToFolder = function(folderId, type) {
    const folder = findTabById(folderId, tabs);
    if (!folder) {
        console.error('The folder with the specified ID does not exist.');
        return;
    }

    openModal(
    'New ' + (type === 'text' ? 'file' : 'folder'), 
    'Enter a name with the path (e.g., "src/main")', 
    'text',
    'Ok', 'Cancel',
    nameBase = 'New ' + (type === 'text' ? 'file' : 'folder')
).then(path => {
        if (path == null) return;

        // Reemplazar barras invertidas '\' por barras normales '/'
        path = path.replace(/\\/g, '/');

        // Dividir la ruta en carpetas y el nombre final
        const pathParts = path.split('/');
        const finalName = pathParts.pop(); // El último elemento es el nombre del archivo/carpeta
        let currentFolder = folder.contents; // Comenzamos en la carpeta seleccionada

        // Crear las carpetas si no existen
        pathParts.forEach(folderName => {
            let subFolder = currentFolder.find(tab => tab.name === folderName && tab.type === 'folder');
            
            if (!subFolder) {
                // Crear la carpeta si no existe
                const newFolder = {
                    id: generateUniqueId(),
                    name: folderName,
                    type: 'folder',
                    contents: [],
                    expanded: true
                };
                currentFolder.push(newFolder);
                currentFolder = newFolder.contents; // Navegar dentro de la nueva carpeta
            } else {
                // Si la carpeta ya existe, navegar dentro de ella
                currentFolder = subFolder.contents;
            }
        });

        // Verificar si ya existe un archivo o carpeta con el mismo nombre
        const existingItem = currentFolder.find(tab => tab.name === finalName && tab.type === type);
        if (existingItem) {
            showToast(`The file "${fileName}" already exists in this folder.`, 'fail', 5000);
            return;
        }

        // Crear el nuevo archivo o carpeta
        const newTab = {
            id: generateUniqueId(),
            name: finalName,
            type: type,
            content: type === 'text' ? '' : undefined,
            contents: type === 'folder' ? [] : undefined,
            expanded: type === 'folder' ? true : undefined
        };

        currentFolder.push(newTab);

        // Guardar cambios y actualizar la interfaz
        Explorer_Save();
        Items_render();
    });
};

	window.Explorer_addItem = function(folderId, type) {
		type ||= prompt('What would you like to add? (text/folder)');
		if(type === 'text' || type === 'folder') {
			addTabToFolder(folderId, type);
		} else if(type != null) {
			alert('Type invalid. Use "text" or "folder".');
		}
	};
	window.Item_rename = function(id) {
	  const tab = findTabById(id, tabs);
	  
		openModal(
		  'Rename file', '', 'text',
		  'Ok', 'Cancel', tab.name
		).then(newName => {
		  if (newName == null)return;
		  newName = (''+newName).trim()
		  if (newName == '')return;
		  
  		if(newName) {
  			// Verificar si el nuevo nombre es el mismo que el actual
  			if(tab.name === newName) {
  				return; // No hacer nada si el nombre no cambia
  			}
  			const sameTypeTabs = tabs.filter(t => t.type === tab.type);
  			let uniqueName = newName;
  			let counter = 1;
  			while(sameTypeTabs.some(t => t.name === uniqueName)) {
  				uniqueName = `${newName} (${counter})`;
  				counter++;
  			}
  			tab.name = uniqueName;
  			Explorer_Save();
  			if(tab.type != 'folder') {
  				// Cerrar y volver a abrir la pestaña para forzar la actualización del nombre en el localStorage
  				Tab_Remove(id); // Cierra la pestaña actual
  				Tab_Add(tab); // Reabre la pestaña con el nuevo nombre
  			}
  			Items_render(); // Actualizar todas las pestañas en el DOM
  			renderEditedTabs(); // Actualizar la barra de pestañas activas
  			updatePlaceholder()
  			
  			showToast('Renamed successfully')
  		}
    })
	};
	/** Descarga el archivo de texto con el contenido correspondiente.
	 * @param {Number} id - El ID de la pestaña.
	 */
	window.File_download = function(id) {
		const tab = findTabById(id, tabs);
		if(tab && tab.type === 'text') {
			const element = document.createElement('a');
			const file = new Blob([tab.content], {
				type: 'text/plain'
			});
			element.href = URL.createObjectURL(file);
			element.download = `${tab.name}.txt`;
			document.body.appendChild(element); // Necesario para Firefox
			element.click();
			document.body.removeChild(element);
		}
	}
	/** Activa el input de subida de archivos para la carpeta seleccionada.
	 * @param {Number} folderId - El ID de la carpeta donde se subirá el archivo.
	 */
	window.File_upload = function(folderId) {
		const fileInput = document.createElement('input');
		fileInput.type = 'file';
		fileInput.accept = '.txt'; // Limitar a archivos de texto, puedes cambiar esto según tu necesidad
		fileInput.onchange = () => handleFileUpload(fileInput.files, folderId);
		fileInput.click();
	}
	/** Maneja la subida de archivos y los agrega a la carpeta seleccionada.
	 * @param {FileList} files - Lista de archivos subidos.
	 * @param {Number} folderId - El ID de la carpeta donde se subirá el archivo.
	 */
	window.handleFileUpload = function(files, folderId) {
		const folderTab = findTabById(folderId, tabs);
		if(folderTab && folderTab.type === 'folder') {
			Array.from(files).forEach(file => {
				const reader = new FileReader();
				reader.onload = (e) => {
					const content = e.target.result;
					const newFileTab = {
						id: generateId(), // Genera un ID único para el nuevo archivo
						type: 'text',
						name: file.name.replace(/\.txt$/, ''), // Remover extensión .txt para el nombre
						content: content
					};
					folderTab.contents.push(newFileTab);
					cutTabId = null;
					updateMoveToRootButtonVisibility()
					updatePlaceholder()
					Items_render()
					renderEditedTabs()
					saveCurrentTabId(newFileTab.id)
					Item_Select(newFileTab.id)
					Explorer_Save()
					saveTabContent()
				};
				reader.readAsText(file);
			});
		}
	}
	window.generateId = function() {
		return Math.floor(Math.random() * Date.now());
	}

	function findTabByName(name, tabList) {
		for(let tab of tabList) {
			if(tab.name === name) return tab;
			
		}
		return null;
	}

	function findTabById(id, tabList) {
		for(let tab of tabList) {
			if(tab.id === id) return tab;
			if(tab.type === 'folder') {
				const found = findTabById(id, tab.contents);
				if(found) return found;
			}
		}
		return null;
	}

	function deleteTabById(id, tabList) {
		return tabList.filter(tab => {
			if(tab.id === id) return false; // Excluir la pestaña que se eliminará
			if(tab.type === 'folder') {
				tab.contents = deleteTabById(id, tab.contents);
			}
			return true;
		});
	}
	$addTextTabButton.onclick = Explorer_addText;
	$addFolderTabButton.onclick = Explorer_addFolder;
	$editor.oninput = () => {
		saveTabContent()
		if(currentTabId !== null) {
			const tab = findTabById(parseInt(currentTabId), tabs);
			tab.content = $editor.value;
			Explorer_Save();
		}
	};
	Items_render();
	if(currentTabId) {
	  Item_Select(parseInt(currentTabId))
	  if (doesTabExist(currentTabId, tabs)){
		  toggleMenu()
	  }
	} else if(tabs.length > 0) {
		Item_Select(tabs[0].id);
	}

	function countTextFiles(tabList) {
		let count = 0;
		for(let tab of tabList) {
			if(tab.type === 'text') {
				count++;
			}
			if(tab.type === 'folder' && tab.contents) {
				count += countTextFiles(tab.contents); // Recursión para contar archivos dentro de carpetas
			}
		}
		return count;
	}
	updatePlaceholder()
});



// ------- Tostadas


let toastId = 0;

function showToast(MENSAJE, _clase = '...', _duracion = 2000) {
  const $toast_container = $('#toast-container');
  const $toast = document.createElement('div');
  const id = toastId++;
  
  $toast.classList.add('toast');
  $toast.classList.add(_clase);
  $toast.setAttribute('id', `toast-${id}`);
  $toast.innerHTML = `
  <div class="toast-content">
    <span>${MENSAJE}</span>
    <span class="toast-close" onclick="closeToast(${id})">&times;</span>
    <div class="toast-progress ${_clase}" style='animation: progress ${_duracion}ms linear;'></div>
  </div>
  `;
  
  // Auto hide after 2 seconds
  setTimeout(() => closeToast(id), _duracion);
  
  $toast_container.appendChild($toast);
  
  // Swipe to remove (PC & Mobile)
  let startX = 0;
  $toast.addEventListener('touchstart', (e) => startX = e.touches[0].clientX);
  $toast.addEventListener('touchmove', (e) => handleSwipe(e, id, startX));
  $toast.addEventListener('mousedown', (e) => startX = e.clientX);
  $toast.addEventListener('mousemove', (e) => handleSwipe(e, id, startX));
}
  
 function handleSwipe(e, id, startX) {
  const $toast = $(`#toast-${id}`);
  const currentX = e.touches ? e.touches[0].clientX : e.clientX;
  const deltaX = currentX - startX;
  
  if (Math.abs(deltaX) > 50) {
    $toast.style.transform = `translateX(${deltaX}px)`;
  }
  
  if (Math.abs(deltaX) > 100) {
    closeToast(id);
  }
}

function closeToast(id) {
  const $toast = $(`#toast-${id}`);
  if ($toast) {
    $toast.classList.add('hide');
    setTimeout(() => {
      if ($toast && $toast.parentElement) {
        $toast.parentElement.removeChild($toast);
      }
    }, 300);
  }
}



// --------- MODAL
let modalResolve; // Para devolver valores cuando se acepta o cancela

function openModal(title, message, inputType = null, acceptText = 'ok', cancelText = 'nop', defaultValue = '') {
  const modal = $('#modal');
  const modalTitle = $('#modal-title');
  const modalMessage = $('#modal-message');
  const modalInput = $('#modal-input');
  const modalAccept = $('#modal-accept');
  const modalCancel = $('#modal-cancel');

  // Configurar título, mensaje y botones
  modalTitle.textContent = title;
  modalMessage.innerHTML = message;
  modalAccept.textContent = acceptText;
  modalCancel.textContent = cancelText;

  // Si hay un tipo de entrada (texto o número)
  if (inputType) {
    modalInput.style.display = 'block';
    modalInput.type = inputType;
    modalInput.value = defaultValue; // Cargar valor predeterminado
    
  } else {
    modalInput.style.display = 'none';
  }

  // Mostrar el modal con animación
  modal.style.display = 'flex'; // Asegurar que se vea
  setTimeout(() => {
    modal.classList.add('modal-show');
    modalInput.focus();
    modal.classList.remove('modal-hide');
  }, 10); // Pequeña demora para que aplique la animación correctamente

  return new Promise((resolve) => {
    modalResolve = resolve;
  });
}

function acceptModal() {
  const modalInput = $('#modal-input');
  const inputValue = modalInput.style.display === 'block' ? modalInput.value : true;

  closeModal(); // Cerrar el modal después de aceptar
  
  (""+inputValue).trim() != ''
    ? modalResolve(inputValue) // Devuelve el valor del input o null si no hay input
    : modalResolve(null) // Devuelve el valor del input o null si no hay input
}

function cancelModal() {
  closeModal(); // Cerrar el modal después de cancelar
  modalResolve(null); // Devuelve null y cancelado
}

function closeModal() {
  const $modal = $('#modal');
  $modal.classList.add('modal-hide');
  $modal.classList.remove('modal-show');

  // Después de la animación, ocultar el modal
  setTimeout(() => {
    $modal.style.display = 'none';
  }, 330); // Tiempo que dura la animación en CSS (0.3s)
}